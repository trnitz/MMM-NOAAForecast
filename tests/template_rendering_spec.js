const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");

const template = fs.readFileSync(
  path.join(__dirname, "..", "MMM-NOAAForecast.njk"),
  "utf8"
);

function renderForecast(overrides, forecastOverrides = {}) {
  const hourlyDewPoint = Object.prototype.hasOwnProperty.call(
    forecastOverrides,
    "hourlyDewPoint"
  )
    ? forecastOverrides.hourlyDewPoint
    : "0°";
  const dailyDewPoint = Object.prototype.hasOwnProperty.call(
    forecastOverrides,
    "dailyDewPoint"
  )
    ? forecastOverrides.dailyDewPoint
    : "40°";
  const config = {
    forecastLayout: "tiled",
    colored: true,
    showInlineIcons: true,
    forecastHeaderText: "",
    showForecastTableColumnHeaderIcons: true,
    frameWidth: 300,
    showCurrentConditions: false,
    showExtraCurrentConditions: false,
    showSummary: false,
    showHourlyForecast: true,
    showDailyForecast: true,
    showHourlyDewPoint: false,
    showDailyDewPoint: false,
    showPrecipitation: false,
    showWind: false,
    iconset: "1c",
    ...overrides
  };

  return nunjucks.renderString(template, {
    config,
    loading: false,
    weatherError: null,
    weatherDataStale: false,
    phrases: {},
    identifier: "test",
    animatedIconSizes: { main: 100, forecast: 30 },
    inlineIcons: {
      dewPoint: "/icons/dewpoint.svg",
      rain: "/icons/rain.svg",
      snow: "/icons/snow.svg",
      wind: "/icons/wind.svg"
    },
    moduleTimestampIdPrefix: "timestamp-",
    timeStamp: "123",
    forecast: {
      currently: {},
      hourly: [
        {
          time: "3 pm",
          iconPath: "/icons/hourly.svg",
          temperature: "60°",
          dewPoint: hourlyDewPoint
        }
      ],
      daily: [
        {
          day: "Tue",
          iconPath: "/icons/daily.svg",
          tempRange: { high: "70°", low: "50°" },
          dewPoint: dailyDewPoint
        }
      ]
    }
  });
}

function forecastRow(html, type) {
  return html.match(
    new RegExp(`<div class="forecast-item ${type}[^\"]*">([\\s\\S]*?)</div>`)
  )[1];
}

describe("forecast dew point template rendering", () => {
  it("renders enabled hourly and daily dew points in the tiled layout", () => {
    const html = renderForecast({
      showHourlyDewPoint: true,
      showDailyDewPoint: true
    });

    expect(html).toContain('class="wrapper tiled');
    expect(forecastRow(html, "hourly")).toContain(
      '<span class="dew-point">0°</span>'
    );
    expect(forecastRow(html, "daily")).toContain(
      '<span class="dew-point">40°</span>'
    );
    expect(html).not.toContain('class="dew-point-header"');
  });

  it("hides missing tiled dew-point values", () => {
    const html = renderForecast(
      { showHourlyDewPoint: true, showDailyDewPoint: true },
      { hourlyDewPoint: null, dailyDewPoint: null }
    );

    expect(html).not.toContain('<span class="dew-point">');
  });

  it("keeps table columns aligned when only hourly dew point is enabled", () => {
    const html = renderForecast({
      forecastLayout: "table",
      showHourlyDewPoint: true
    });
    const hourlyRow = forecastRow(html, "hourly");
    const dailyRow = forecastRow(html, "daily");

    expect(html).toContain('class="dew-point-header"');
    expect(hourlyRow).toContain('<span class="dew-point">0°</span>');
    expect(hourlyRow.match(/class="dew-point-container"/g)).toHaveLength(1);
    expect(dailyRow.match(/class="dew-point-container"/g)).toHaveLength(1);
    expect(dailyRow).not.toContain('<span class="dew-point">');
  });

  it("omits the table header and row cells when dew points are disabled", () => {
    const html = renderForecast({ forecastLayout: "table" });

    expect(html).not.toContain('class="dew-point-header"');
    expect(forecastRow(html, "hourly")).not.toContain(
      'class="dew-point-container"'
    );
    expect(forecastRow(html, "daily")).not.toContain(
      'class="dew-point-container"'
    );
  });
});
