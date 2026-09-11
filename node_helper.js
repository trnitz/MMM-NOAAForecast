/*********************************

  Node Helper for MMM-NOAAForecast.

  This helper is responsible for the DarkSky-compatible data pull from NOAA.

  Sample API:

    e.g. https://api.weather.gov/points/40.8932469,-74.0116536

*********************************/

var NodeHelper = require("node_helper");
var needle = require("needle");
var moment = require("moment");

module.exports = NodeHelper.create({
  start: function () {
    this.inFlightRequests = {};
    this.pointsCache = {};
    console.log(
      `====================== Starting node_helper for module [${this.name}]`
    );
  },

  getNeedleOptions: function () {
    return {
      follow_max: 3,
      open_timeout: 10000,
      response_timeout: 10000,
      read_timeout: 10000,
      headers: {
        Accept: "application/geo+json, application/json",
        "User-Agent":
          "MMM-NOAAForecast/1.0 (https://github.com/trnitz/MMM-NOAAForecast)"
      }
    };
  },

  parseJsonResponse: function (body) {
    if (typeof body === "string" || Buffer.isBuffer(body)) {
      return JSON.parse(body.toString());
    }
    return body;
  },

  requestJson: function (url, attempt) {
    var self = this;
    var currentAttempt = attempt || 0;
    var maxAttempts = 3;

    return new Promise(function (resolve, reject) {
      needle.get(url, self.getNeedleOptions(), function (error, response, body) {
        var statusCode = response && response.statusCode;
        if (!error && statusCode >= 200 && statusCode < 300) {
          try {
            resolve(self.parseJsonResponse(body));
            return;
          } catch (parseError) {
            error = parseError;
          }
        }

        var requestError =
          error || new Error(`NOAA request returned HTTP ${statusCode || "?"}`);
        var retryable =
          !!error || statusCode === 408 || statusCode === 429 || statusCode >= 500;
        if (retryable && currentAttempt + 1 < maxAttempts) {
          var retryDelay = 750 * Math.pow(2, currentAttempt);
          setTimeout(function () {
            self
              .requestJson(url, currentAttempt + 1)
              .then(resolve)
              .catch(reject);
          }, retryDelay);
        } else {
          reject(requestError);
        }
      });
    });
  },

  getForecastUrls: function (latitude, longitude) {
    var self = this;
    var cacheKey = `${latitude},${longitude}`;
    var cached = this.pointsCache[cacheKey];
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.urls);
    }

    var pointsUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
    console.log(`[MMM-NOAAForecast] Getting data: ${pointsUrl}`);
    return this.requestJson(pointsUrl).then(function (pointsData) {
      var properties = pointsData && pointsData.properties;
      if (
        !properties ||
        !properties.forecast ||
        !properties.forecastHourly ||
        !properties.forecastGridData
      ) {
        throw new Error("NOAA points response is missing forecast URLs");
      }

      var urls = {
        forecast: properties.forecast,
        forecastHourly: properties.forecastHourly,
        forecastGridData: properties.forecastGridData
      };
      self.pointsCache[cacheKey] = {
        urls: urls,
        expiresAt: Date.now() + 60 * 60 * 1000
      };
      return urls;
    });
  },

  validateForecastData: function (forecastData) {
    return !!(
      forecastData.forecast &&
      forecastData.forecast.properties &&
      Array.isArray(forecastData.forecast.properties.periods) &&
      forecastData.forecast.properties.periods.length > 0 &&
      forecastData.forecastHourly &&
      forecastData.forecastHourly.properties &&
      Array.isArray(forecastData.forecastHourly.properties.periods) &&
      forecastData.forecastHourly.properties.periods.length > 0 &&
      forecastData.forecastGridData &&
      forecastData.forecastGridData.properties
    );
  },

  addForecastUnits: function (url, units) {
    var unitSystem = units === "metric" ? "si" : "us";
    var forecastUrl = new URL(url);
    forecastUrl.searchParams.set("units", unitSystem);
    return forecastUrl.toString();
  },

  sendForecastError: function (instanceId, error) {
    console.log(
      `[MMM-NOAAForecast] ${moment().format(
        "D-MMM-YY HH:mm"
      )} ** ERROR ** ${error.message || error}`
    );
    this.sendSocketNotification("NOAA_CALL_FORECAST_ERROR", {
      instanceId: instanceId,
      error: "Unable to retrieve complete NOAA forecast data"
    });
  },

  fetchForecast: function (payload) {
    var self = this;
    var latitude = Number(payload.latitude);
    var longitude = Number(payload.longitude);
    var instanceId = payload.instanceId;

    if (
      payload.latitude === "" ||
      payload.latitude === null ||
      typeof payload.latitude === "undefined" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      payload.longitude === "" ||
      payload.longitude === null ||
      typeof payload.longitude === "undefined" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      this.sendForecastError(
        instanceId,
        new Error("Valid latitude and longitude are required")
      );
      return;
    }

    if (!this.inFlightRequests) this.inFlightRequests = {};
    if (!this.pointsCache) this.pointsCache = {};
    if (this.inFlightRequests[instanceId]) {
      console.log(
        `[MMM-NOAAForecast] Skipping overlapping request for ${instanceId}`
      );
      return;
    }
    this.inFlightRequests[instanceId] = true;

    this.getForecastUrls(latitude, longitude)
      .then(function (urls) {
        return Promise.all([
          self.requestJson(self.addForecastUnits(urls.forecast, payload.units)),
          self.requestJson(
            self.addForecastUnits(urls.forecastHourly, payload.units)
          ),
          self.requestJson(urls.forecastGridData)
        ]);
      })
      .then(function (responses) {
        var forecastData = {
          forecast: responses[0],
          forecastHourly: responses[1],
          forecastGridData: responses[2]
        };
        if (!self.validateForecastData(forecastData)) {
          throw new Error("NOAA returned incomplete forecast data");
        }

        self.sendSocketNotification("NOAA_CALL_FORECAST_DATA", {
          instanceId: instanceId,
          payload: forecastData
        });
      })
      .catch(function (error) {
        delete self.pointsCache[`${latitude},${longitude}`];
        self.sendForecastError(instanceId, error);
      })
      .finally(function () {
        delete self.inFlightRequests[instanceId];
      });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NOAA_CALL_FORECAST_GET") {
      this.fetchForecast(payload || {});
    }
  }
});
