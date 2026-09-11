# MMM-NOAAForecast

This is a module for [MagicMirror²](https://magicmirror.builders/).

[MagicMirror² on GitHub](https://github.com/MichMich/MagicMirror)

![Screenshot](screenshots/detailed_table_layout.png?raw=true "Screenshot")

A weather module that displays current, hourly and daily forecast information using data from NOAA, not requiring API keys nor any fees. Of course, this means that this module is only useful for locations in the United States and its territories.

IMPORTANT: Although it supports metric units, the textual data from NOAA is in imperial units, so ultimately the output will be mixed (but with units clearly denoted).

The imperial/metric determination is made by the MagicMirror configuration option `units:` in your *config.js* file.

This module incorporates code and inspiration from [MMM-OpenWeatherForecast](https://github.com/Tom-Hirschberger/MMM-OpenWeatherForecast) by Tom Hirschberger, licensed under the MIT License.

## Installation

1. Navigate into your MagicMirror `modules` folder and clone the repository:

   ```sh
   git clone https://github.com/trnitz/MMM-NOAAForecast.git
   ```

2. Enter the new `MMM-NOAAForecast` directory and install its dependencies:

   ```sh
   cd MMM-NOAAForecast
   npm install
   ```

## Configuration

At a minimum you need to supply the following required configuration parameters:

- `latitude`
- `longitude`

Find out your latitude and longitude here:
`https://www.latlong.net/`.

### Other optional parameters

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `frameWidth` | Number | `300` | Width of the rendered module column in pixels. Increase it to align with neighbouring modules in the same region. |
| `updateInterval` | Number | `10` | How frequently, in minutes, to poll NOAA for updated data. |
| `requestDelay` | Number | `0` | Delay before the request, in milliseconds. Stagger this when running multiple instances so their requests are not made simultaneously. |
| `updateFadeSpeed` | Number | `500` | Fade duration during a data refresh, in milliseconds. Set it to `0` to disable the fade. |
| `colored` | Boolean | `true` | Whether to present the module in color. When `false`, the monochrome version of the selected icon set is used when available. |
| `showCurrentConditions` | Boolean | `true` | Whether to show the current temperature and current-conditions icon. |
| `showExtraCurrentConditions` | Boolean | `true` | Whether to show high/low temperatures, precipitation, wind speed, and other enabled current-condition details. |
| `showDewPoint` | Boolean | `false` | Whether to show the current dew point. The value follows the configured global units. |
| `showSummary` | Boolean | `true` | Whether to show the forecast summary. |
| `forecastHeaderText` | String | `""` | Text displayed above the forecast. An empty string hides the header. |
| `showForecastTableColumnHeaderIcons` | Boolean | `true` | Whether to show icon-based column headers in the table layout. |
| `showHourlyForecast` | Boolean | `true` | Whether to show hourly forecasts. Used with `hourlyForecastInterval` and `maxHourliesToShow`. |
| `hourlyForecastInterval` | Number | `3` | Number of hours between each displayed hourly forecast. |
| `maxHourliesToShow` | Number | `3` | Maximum number of hourly forecasts to display. |
| `showDailyForecast` | Boolean | `true` | Whether to show daily forecasts. Used with `maxDailiesToShow`. |
| `maxDailiesToShow` | Number | `3` | Maximum number of daily forecasts to display. |
| `showPrecipitation` | Boolean | `true` | Whether to show precipitation details for current, hourly, and daily conditions. In the table layout, accumulation is stacked beneath precipitation chance. |
| `showPrecipitationStartStop` | Boolean | `false` | Whether to show a message when rain, snow, or other precipitation is expected to start or stop within 24 hours. |
| `showWind` | Boolean | `true` | Whether to show wind information for current, hourly, and daily conditions. |
| `concise` | Boolean | `true` | Whether to use shorter summaries and omit details such as precipitation accumulation and wind gusts. |
| `iconset` | String | `"1c"` | Icon set used for forecast and inline icons. See the preview below. |
| `mainIconset` | String | `"1c"` | Icon set used for the main current-weather icon. |
| `useAnimatedIcons` | Boolean | `true` | Legacy Skycons animation support. Prefer the `6fa` or `6oa` animated icon sets. Flat icons are still used for inline details. |
| `animateMainIconOnly` | Boolean | `true` | Whether legacy Skycons animation is limited to the main current-conditions icon. Disabling this may affect performance on low-powered devices. |
| `showInlineIcons` | Boolean | `true` | Whether to prefix wind and precipitation information with icons. This primarily affects the tiled layout. |
| `forecastLayout` | String | `"tiled"` | Forecast layout. Accepted values are `"tiled"` and `"table"`. |
| `label_gust` | String | `"max"` | Label placed before wind gust values. |
| `label_high` | String | `"H"` | Label placed before high temperatures. |
| `label_low` | String | `"L"` | Label placed before low temperatures. |
| `label_timeFormat` | String | `"h a"` | Hourly forecast time format using [Moment.js tokens](https://momentjs.com/docs/#/displaying/format/). For example, `"k[h]"` displays `14h`. |
| `label_days` | Array of strings | `['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat']` | Day labels beginning with Sunday at index `0`. |
| `label_ordinals` | Array of strings | 16 compass points | Wind-direction labels beginning with north at index `0` and proceeding clockwise. |

## Sample Configuration

```
{
  module: "MMM-NOAAForecast",
  header: "Weather",
  position: "top_right",
  disabled: false,
  config: {
    latitude: "39.7392",
    longitude: "-104.9902",
    iconset: "1c",
    concise: false,
    forecastLayout: "table"
  }
},
```

## Icon Sets

![Icon Sets](icons/iconsets.gif?raw=true "Icon Sets")
![Icon Sets 7 and 8](icons/iconsets-7-8.png?raw=true "Icon Sets 7 and 8")

Available values for `iconset` and `mainIconset`:

| Value | Icon set |
| --- | --- |
| `1c`–`5c` | Original colored sets |
| `1m`–`5m` | Original monochrome sets |
| `6fa` | Filled animated set |
| `6oa` | Outline animated set |
| `7c` | [Meteocons](https://github.com/basmilius/weather-icons) static filled set |
| `7m` | [Meteocons](https://github.com/basmilius/weather-icons) static monochrome set |
| `8c` | [Makin-Things Weather Icons](https://github.com/Makin-Things/weather-icons) static set |

Select a set by using the same value for the forecast and current-condition icons:

```js
config: {
  iconset: "7c",
  mainIconset: "7c"
}
```

Replace `7c` with `7m` or `8c` to use one of the other sets.

## Layout examples

![Space-saving table layout](screenshots/compact_space_saving_table_layout.png?raw=true)
![Current conditions without a forecast](screenshots/current_contditions_no_forecast_layout.png?raw=true)
![Wide, colorful tiled layout](screenshots/wide_colorful_tiled_layout.png?raw=true)

## Styling

The module's width is controlled by the [`frameWidth`](#configuration) config option (default `300px`). Set it to match the width of neighbouring modules in the same region — raise it if you have a wider sibling module so the columns line up.

### Visual conventions

- **Today / next-upcoming accent.** The first hourly row receives an amber (`#f5b041`) left border and time label; if `includeTodayInDailyForecast` is enabled, today's daily row receives the same accent on its day name. This mirrors the convention used by sibling modules so the eye finds "now" instantly.
- **Single divider between hourly and daily.** Per-row borders have been replaced with row spacing and one divider between the hourly and daily sections — less line noise, easier scanning at a glance.
- **Column-header icons replace inline icons in table rows.** When `showForecastTableColumnHeaderIcons: true` and `forecastLayout: "table"`, the precipitation and wind icons rendered inline in each row are suppressed, since the column headers already convey the same signal.
- **"Feels like" temperature is labelled.** The current-conditions row reads e.g. `52°  FEELS LIKE 47°` so the secondary temperature is unambiguous.

### Custom overrides

Most important elements of this module have one or more class names applied. Examine the `MMM-NOAAForecast.css` file or inspect elements directly with your browser of choice to determine what class you would like to override from your `custom.css`.

## Attributions

- [Skycons animated icons by Dark Sky](http://darkskyapp.github.io/skycons/), using [Maxime Warner's fork](https://github.com/maxdow/skycons), which supports coloring individual details
- [Climacons by Adam Whitcroft](http://adamwhitcroft.com/climacons/)
- [Free Weather Icons by Svilen Petrov](https://www.behance.net/gallery/12410195/Free-Weather-Icons)
- [Weather Icons by Thom](https://dribbble.com/shots/1832162-Weather-Icons), designed for DuckDuckGo
- Sets 4 and 5 were found on Graphberry: [Weather Icons](https://www.graphberry.com/item/weather-icons) and [Weathera Weather Forecast Icons](https://www.graphberry.com/item/weathera-weather-forecast-icons). The original artists could not be identified.
- [Meteocons by Bas Milius](https://github.com/basmilius/weather-icons), licensed under the MIT License
- [Makin-Things Weather Icons](https://github.com/Makin-Things/weather-icons), licensed under the MIT License

Some of the icons were modified to better work with the module's
structure and aesthetic.

The dew point icon is from **[MMM-OpenWeatherForecast](https://github.com/jclarke0000/MMM-OpenWeatherForecast)**
by Jeff Clarke, licensed under the MIT License.

[MMM-OpenWeatherForecast](https://github.com/Tom-Hirschberger/MMM-OpenWeatherForecast) by Tom Hirschberger is licensed under the MIT License.

Data provided by the [NOAA Weather API](https://www.weather.gov/documentation/services-web-api).
