const mockNeedleGet = jest.fn();

jest.mock(
  "node_helper",
  () => ({
    create: (definition) => definition
  }),
  { virtual: true }
);

jest.mock("needle", () => ({
  get: mockNeedleGet
}));

const helperDefinition = require("../node_helper.js");

describe("NOAA node helper", () => {
  let helper;

  beforeEach(() => {
    mockNeedleGet.mockReset();
    helper = Object.create(helperDefinition);
    helper.inFlightRequests = {};
    helper.pointsCache = {};
    helper.sendSocketNotification = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("identifies the module and applies request timeouts", () => {
    const options = helper.getNeedleOptions();

    expect(options.headers["User-Agent"]).toContain("MMM-NOAAForecast");
    expect(options.open_timeout).toBeGreaterThan(0);
    expect(options.response_timeout).toBeGreaterThan(0);
    expect(options.read_timeout).toBeGreaterThan(0);
  });

  it("requests all endpoints and publishes only complete data", async () => {
    const responses = {
      "https://api.weather.gov/points/40,-75": {
        properties: {
          forecast: "https://example.test/forecast",
          forecastHourly: "https://example.test/hourly",
          forecastGridData: "https://example.test/grid"
        }
      },
      "https://example.test/forecast?units=si": {
        properties: { periods: [{}] }
      },
      "https://example.test/hourly?units=si": {
        properties: { periods: [{}] }
      },
      "https://example.test/grid": { properties: {} }
    };
    mockNeedleGet.mockImplementation((url, options, callback) => {
      callback(null, { statusCode: 200 }, responses[url]);
    });

    helper.fetchForecast({
      latitude: "40",
      longitude: "-75",
      instanceId: "module_1",
      units: "metric"
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(helper.sendSocketNotification).toHaveBeenCalledTimes(1);
    expect(helper.sendSocketNotification).toHaveBeenCalledWith(
      "NOAA_CALL_FORECAST_DATA",
      expect.objectContaining({ instanceId: "module_1" })
    );
    expect(mockNeedleGet).toHaveBeenCalledTimes(4);
    expect(helper.inFlightRequests.module_1).toBeUndefined();
  });

  it("retries a failed request three times", async () => {
    jest.useFakeTimers();
    mockNeedleGet.mockImplementation((url, options, callback) => {
      callback(new Error("network unavailable"));
    });

    const request = helper.requestJson("https://example.test/forecast");
    const rejection = expect(request).rejects.toThrow("network unavailable");
    await jest.runAllTimersAsync();
    await rejection;

    expect(mockNeedleGet).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-transient client error", async () => {
    mockNeedleGet.mockImplementation((url, options, callback) => {
      callback(null, { statusCode: 404 }, {});
    });

    await expect(
      helper.requestJson("https://example.test/missing")
    ).rejects.toThrow("HTTP 404");

    expect(mockNeedleGet).toHaveBeenCalledTimes(1);
  });

  it("rejects missing coordinates without making a request", () => {
    helper.fetchForecast({
      latitude: "",
      longitude: "",
      instanceId: "module_1"
    });

    expect(mockNeedleGet).not.toHaveBeenCalled();
    expect(helper.sendSocketNotification).toHaveBeenCalledWith(
      "NOAA_CALL_FORECAST_ERROR",
      expect.objectContaining({ instanceId: "module_1" })
    );
  });

  it("does not start an overlapping request for the same instance", () => {
    mockNeedleGet.mockImplementation(() => {});
    const payload = {
      latitude: "40",
      longitude: "-75",
      instanceId: "module_1"
    };

    helper.fetchForecast(payload);
    helper.fetchForecast(payload);

    expect(mockNeedleGet).toHaveBeenCalledTimes(1);
  });

  it("rejects partial forecast responses", () => {
    expect(
      helper.validateForecastData({
        forecast: { properties: { periods: [{}] } },
        forecastHourly: { properties: { periods: [] } },
        forecastGridData: { properties: {} }
      })
    ).toBe(false);
  });
});
