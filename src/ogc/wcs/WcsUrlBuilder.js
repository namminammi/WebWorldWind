/*
 * Copyright 2018 WorldWind Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @exports WcsUrlBuilder
 */
define([
        '../../error/ArgumentError',
        '../../util/Logger',
        '../../ogc/wcs/WcsCoverage',
        '../../util/UrlBuilder'
    ],
    function (ArgumentError,
              Logger,
              WcsCoverage,
              UrlBuilder) {
        "use strict";

        var WcsUrlBuilder = function (wcsCoverage) {
            UrlBuilder.call(this);

            if (!wcsCoverage) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "constructor",
                        "The specified WcsCoverage is null or undefined"));
            }

            /**
             * The WcsCoverage source for the url GetCoverage requests.
             */
            this.wcsCoverage = wcsCoverage;
        };

        WcsUrlBuilder.prototype = Object.create(UrlBuilder.prototype);

        WcsUrlBuilder.TILE_HEIGHT = 256;

        WcsUrlBuilder.TILE_WIDTH = 256;

        WcsUrlBuilder.PREFERRED_FORMATS = ["geotiff", "tiff"];

        WcsUrlBuilder.prototype.urlForTile = function (tile, format) {
            if (!tile) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "urlForTile", "missingTile"));
            }

            if (!format) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsUrlBuilder", "urlForTile",
                        "The specified format is null or undefined."));
            }

            var requestUrl = this.fixGetCoverageString(
                this.wcsCoverage.webCoverageService.capabilities.getCoverageBaseUrl(this.wcsCoverage.coverageId));
            requestUrl += "SERVICE=WCS";
            requestUrl += "&REQUEST=GetCoverage";

            if (this.wcsCoverage.webCoverageService.capabilities.version === "1.0.0") {
                return this.buildUrl100(tile, requestUrl);
            } else if (this.wcsCoverage.webCoverageService.capabilities.version === "2.0.1" || this.wcsCoverage.webCoverageService.capabilities.version === "2.0.0") {
                return this.buildUrl20x(tile, requestUrl);
            }

        };

        WcsUrlBuilder.prototype.buildUrl100 = function (tile, requestUrl) {
            var format = this.findPreferredFormat() || "image/tiff", sector = tile.sector;

            requestUrl += "&VERSION=1.0.0";
            requestUrl += "&COVERAGE=" + this.wcsCoverage.coverageId;
            requestUrl += "&CRS=EPSG:4326";
            requestUrl += "&WIDTH=" + WcsUrlBuilder.TILE_WIDTH;
            requestUrl += "&HEIGHT=" + WcsUrlBuilder.TILE_HEIGHT;
            requestUrl += "&FORMAT=" + format;
            requestUrl += "&BBOX=" + sector.minLongitude + "," + sector.minLatitude + "," + sector.maxLongitude +
                "," + sector.maxLatitude;

            return encodeURI(requestUrl);
        };

        WcsUrlBuilder.prototype.buildUrl20x = function (tile, requestUrl) {
            var format = this.findPreferredFormat() || "image/tiff";
            var sector = tile.sector, latLabel, lonLabel;
            var idx = this.wcsCoverage.webCoverageService.coverageDescriptions.coverageMap[this.wcsCoverage.coverageId];
            var scaleLabels = this.wcsCoverage.webCoverageService.coverageDescriptions.coverages[idx].domainSet.rectifiedGrid.axisLabels;
            var axisLabels = this.wcsCoverage.webCoverageService.coverageDescriptions.coverages[idx].boundedBy.envelope.axisLabels;
            if (axisLabels[0].toLowerCase().indexOf("lat") >= 0) {
                latLabel = axisLabels[0];
                lonLabel = axisLabels[1];
            } else {
                latLabel = axisLabels[1];
                lonLabel = axisLabels[0];
            }

            requestUrl += "&VERSION=" + this.wcsCoverage.webCoverageService.capabilities.version;
            requestUrl += "&COVERAGEID=" + this.wcsCoverage.coverageId;
            requestUrl += "&FORMAT=" + format;
            requestUrl += "&SCALESIZE=" + scaleLabels[0] + "(" + WcsUrlBuilder.TILE_WIDTH + ")," + scaleLabels[1] + "(" + WcsUrlBuilder.TILE_HEIGHT + ")";
            requestUrl += "&OVERVIEWPOLICY=NEAREST";
            requestUrl += "&SUBSET=" + latLabel + "(" + sector.minLatitude + "," + sector.maxLatitude + ")";
            requestUrl += "&SUBSET=" + lonLabel + "(" + sector.minLongitude + "," + sector.maxLongitude + ")";

            return encodeURI(requestUrl);
        };

        WcsUrlBuilder.prototype.findPreferredFormat = function () {
            var version = this.wcsCoverage.webCoverageService.capabilities.version, availableFormats, idx, format;

            if (version === "1.0.0") {
                idx = this.wcsCoverage.webCoverageService.coverageDescriptions.coverageMap[this.wcsCoverage.coverageId];
                availableFormats = this.wcsCoverage.webCoverageService.coverageDescriptions.coverages[idx].supportedFormats.formats;
            } else if (version === "2.0.1" || version === "2.0.0") {
                idx = this.wcsCoverage.webCoverageService.capabilities.coverageMap[this.wcsCoverage.coverageId];
                availableFormats = this.wcsCoverage.webCoverageService.capabilities.serviceMetadata.formatsSupported
            }

            for (var i = 0; i < WcsUrlBuilder.PREFERRED_FORMATS.length; i++) {
                format = WcsUrlBuilder.PREFERRED_FORMATS[i].toLowerCase();
                for (var j =0; j < availableFormats.length; j++) {
                    if (availableFormats[j].toLowerCase().indexOf(format) >= 0) {
                        return availableFormats[j];
                    }
                }
            }

            return null;
        };

        // Intentionally not documented - copied from WmsUrlBuilder see issue #154
        WcsUrlBuilder.prototype.fixGetCoverageString = function (serviceAddress) {
            if (!serviceAddress) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WmsUrlBuilder", "fixGetMapString",
                        "The specified service address is null or undefined."));
            }

            var index = serviceAddress.indexOf("?");

            if (index < 0) { // if string contains no question mark
                serviceAddress = serviceAddress + "?"; // add one
            } else if (index !== serviceAddress.length - 1) { // else if question mark not at end of string
                index = serviceAddress.search(/&$/);
                if (index < 0) {
                    serviceAddress = serviceAddress + "&"; // add a parameter separator
                }
            }

            return serviceAddress;
        };

        return WcsUrlBuilder;
    });
