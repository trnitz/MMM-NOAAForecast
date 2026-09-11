const moment = require("moment");

global.moment = moment;
global.Module = {
  register: jest.fn((moduleName, moduleDefinition) => {
    global.MMM_NOAAForecast = moduleDefinition;
  })
};
global.config = { units: "imperial" };
global.Log = {
  info: jest.fn(),
  log: jest.fn(),
  error: jest.fn()
};

require("../MMM-NOAAForecast.js");

describe("forecast socket handling", () => {
  let module;

  beforeEach(() => {
    module = Object.create(global.MMM_NOAAForecast);
    module.identifier = "module_1";
    module.config = {
      ...global.MMM_NOAAForecast.defaults,
      useAnimatedIcons: false,
      updateFadeSpeed: 0
    };
    module.weatherData = { previous: true };
    module.formattedWeatherData = { previous: true };
    module.weatherError = null;
    module.weatherDataStale = false;
    module.preProcessWeatherData = jest.fn();
    module.processWeatherData = jest.fn(() => ({ current: true }));
    module.updateDom = jest.fn();
    module.sendNotification = jest.fn();
  });

  it("keeps the last forecast when the helper reports an error", () => {
    const previousForecast = module.formattedWeatherData;

    module.socketNotificationReceived("NOAA_CALL_FORECAST_ERROR", {
      instanceId: "module_1",
      error: "Unable to retrieve NOAA data"
    });

    expect(module.formattedWeatherData).toBe(previousForecast);
    expect(module.weatherDataStale).toBe(true);
    expect(module.updateDom).toHaveBeenCalledWith(0);
  });

  it("rejects incomplete data without replacing the last forecast", () => {
    const previousWeatherData = module.weatherData;

    module.socketNotificationReceived("NOAA_CALL_FORECAST_DATA", {
      instanceId: "module_1",
      payload: {
        forecast: { properties: { periods: [] } },
        forecastHourly: { properties: { periods: [{}] } },
        forecastGridData: { properties: {} }
      }
    });

    expect(module.weatherData).toBe(previousWeatherData);
    expect(module.weatherDataStale).toBe(true);
    expect(module.preProcessWeatherData).not.toHaveBeenCalled();
  });

  it("accepts complete object responses and clears stale state", () => {
    module.weatherError = "Previous error";
    module.weatherDataStale = true;

    module.socketNotificationReceived("NOAA_CALL_FORECAST_DATA", {
      instanceId: "module_1",
      payload: {
        forecast: { properties: { periods: [{}] } },
        forecastHourly: { properties: { periods: [{}] } },
        forecastGridData: { properties: {} }
      }
    });

    expect(module.preProcessWeatherData).toHaveBeenCalledTimes(1);
    expect(module.formattedWeatherData).toEqual({ current: true });
    expect(module.weatherError).toBeNull();
    expect(module.weatherDataStale).toBe(false);
    expect(module.sendNotification).toHaveBeenCalledTimes(1);
  });

  it("restores previous data when processing a complete response fails", () => {
    const previousWeatherData = module.weatherData;
    module.processWeatherData.mockImplementation(() => {
      throw new Error("Unexpected response shape");
    });

    module.socketNotificationReceived("NOAA_CALL_FORECAST_DATA", {
      instanceId: "module_1",
      payload: {
        forecast: { properties: { periods: [{}] } },
        forecastHourly: { properties: { periods: [{}] } },
        forecastGridData: { properties: {} }
      }
    });

    expect(module.weatherData).toBe(previousWeatherData);
    expect(module.formattedWeatherData).toEqual({ previous: true });
    expect(module.weatherDataStale).toBe(true);
    expect(module.sendNotification).not.toHaveBeenCalled();
  });
});
