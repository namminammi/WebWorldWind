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
 * @exports WcsCoverage
 */
define([
        '../../error/ArgumentError',
        '../../util/Logger',
        '../../geom/Sector'
    ],
    function (ArgumentError,
              Logger,
              Sector) {
        "use strict";

        /**
         * A simple object representation of a Web Coverage Service coverage. Provides utility methods and properties
         * for use in common WCS Coverage operations.
         * @param {String} coverageId the name or id of the coverage
         * @param {WebCoverageService} webCoverageService the WebCoverageService providing the coverage
         * @constructor
         */
        var WcsCoverage = function (coverageId, webCoverageService) {
            if (!coverageId) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsCoverage", "constructor",
                        "The specified coverage id is null or undefined."));
            }

            if (!webCoverageService) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsCoverage", "constructor",
                        "The specified WebCoverageService is null or undefined."));
            }

            /**
             * The Web Coverage Service Coverages id or name as assigned by the providing service.
             * @type {String}
             */
            this.coverageId = coverageId;

            /**
             * The WebCoverageService responsible for managing this Coveragea and Web Coverage Service.
             * @type {WebCoverageService}
             */
            this.webCoverageService = webCoverageService;

            /**
             * The Sector representing the bounds of the coverage.
             */
            this.sector = this.webCoverageService.coverageDescriptions.getSector(this.coverageId);

            /**
             * The resolution of the coverage, in degrees.
             */
            this.resolution = this.webCoverageService.coverageDescriptions.getResolution(this.coverageId);
        };

        // Internal use only
        WcsCoverage.prototype.createElevationConfiguration = function () {
            // check if this service is 2.0.x and supports the scaling extension
            if (this.webCoverageService.capabilities.version === "2.0.0" || this.webCoverageService.capabilities.version === "2.0.1") {
                if (this.webCoverageService.capabilities.serviceIdentification.profile
                    .indexOf("http://www.opengis.net/spec/WCS_service-extension_scaling/1.0/conf/scaling") < 0) {
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsCoverage", "createElevationConfiguration",
                        "The web coverage service doesn't support the necessary scaling extension.");
                    return null;
                }
            }

            var baseUrl, urlBuilder, requestUrl, idx, crs, format, subsetXLabel, subsetYLabel, axisXLabel, axisYLabel;

            var elevationConfig = {
                name: this.coverageId,
                boundingBox: this.boundingBox,
                samplesPerRadian: this.samplesPerRadian
            };

            baseUrl = this.prepareBaseUrl(this.getCoverageUrl());

            if (this.capabilities.version === "1.0.0") {
                // Check for WGS84 or EPSG:4326 CRS
                idx = WcsCoverage.indexOf(this.describeCoverage.coverages, "name", this.coverageId);
                if (idx < 0) {
                    // TODO log message
                    return null;
                }

                for (var i = 0, len = this.describeCoverage.coverages[idx].supportedCrs.requests.length; i < len; i++) {
                    crs = this.describeCoverage.coverages[idx].supportedCrs.requests[i];
                    if (crs.indexOf("WGS84") >= 0 || crs.indexOf("4326") >= 0) {
                        break;
                    }
                    crs = null;
                }
                if (!crs) {
                    // TODO log message
                    return null;
                }

                // determine preferred format
                format = this.findPreferredFormat(this.describeCoverage.coverages[idx].supportedFormats.formats);
                if (!format) {
                    // TODO log message
                    return null;
                }

                requestUrl = baseUrl;
                requestUrl += "SERVICE=WCS";
                requestUrl += "&REQUEST=GetCoverage";
                requestUrl += "&VERSION=1.0.0";
                requestUrl += "&COVERAGE=" + this.coverageId;
                requestUrl += "&CRS=" + crs;
                requestUrl += "&WIDTH=" + 256;
                requestUrl += "&HEIGHT=" + 256;
                requestUrl += "&FORMAT=" + format;

                urlBuilder = function (formattedUrl) {
                    var url = formattedUrl;

                    return {
                        urlForTile: function (sector) {
                            url += "&BBOX=";
                            url += sector.minLongitude + ",";
                            url += sector.minLatitude + ",";
                            url += sector.maxLongitude + ",";
                            url += sector.maxLatitude;

                            return encodeURI(url);
                        }
                    };
                };

                elevationConfig.urlBuilder = urlBuilder(requestUrl);
            } else if (this.capabilities.version === "2.0.0" || this.capabilities.version === "2.0.1") {
                // Check for WGS84 or EPSG:4326 CRS
                idx = WcsCoverage.indexOf(this.describeCoverage.coverages, "coverageId", this.coverageId);
                if (idx < 0) {
                    // TODO log message
                    return null;
                }

                // TODO WCS 2.0.1 uses the CRS defined in the Envelope for sub-setting coverages, should we check to make sure the coverage uses EPSG:4326 or CRS84???

                // determine preferred format
                format = this.findPreferredFormat(this.capabilities.serviceMetadata.formatsSupported);
                if (!format) {
                    // TODO log message
                    return null;
                }

                // determine the subset coordinate system labels
                subsetXLabel = this.describeCoverage.coverages[idx].boundedBy.envelope.axisLabels[0];
                subsetYLabel = this.describeCoverage.coverages[idx].boundedBy.envelope.axisLabels[1];

                // determine the scaling coordinate system labels
                axisXLabel = this.describeCoverage.coverages[idx].domainSet.rectifiedGrid.axisLabels[0];
                axisYLabel = this.describeCoverage.coverages[idx].domainSet.rectifiedGrid.axisLabels[1];

                requestUrl = baseUrl;
                requestUrl += "SERVICE=WCS";
                requestUrl += "&REQUEST=GetCoverage";
                requestUrl += "&VERSION=" + this.capabilities.version;
                requestUrl += "&COVERAGEID=" + this.coverageId;
                requestUrl += "&FORMAT=" + format;
                requestUrl += "&SCALESIZE=" + axisXLabel + "(256)," + axisYLabel + "(256)";
                requestUrl += "&OVERVIEWPOLICY=NEAREST";

                urlBuilder = function (formattedUrl, subsetXLabel, subsetYLabel) {
                    var url = formattedUrl;
                    var x = subsetXLabel;
                    var y = subsetYLabel;
                    return {
                        urlForTile: function (sector) {
                            url += "&SUBSET=" + x + "(";
                            url += sector.minLatitude + ",";
                            url += sector.maxLatitude + ")";
                            url += "&SUBSET=" + y + "(";
                            url += sector.minLongitude + ",";
                            url += sector.maxLongitude + ")";

                            return encodeURI(url);
                        }
                    };
                };

                elevationConfig.urlBuilder = urlBuilder(requestUrl, subsetXLabel, subsetYLabel);
            }

            elevationConfig.samplesPerRadian = this.samplesPerRadian;
            elevationConfig.boundingBox = this.boundingBox;
            elevationConfig.coverageId = this.coverageId;

            return elevationConfig;
        };

        // Internal use only
        WcsCoverage.prototype.findPreferredFormat = function (formats) {
            // preferred format goes: GeoTiff then tiff
            var len = formats.length, format;

            // check for geotiff first
            for (var i = 0; i < len; i++) {
                if (formats[i].toLowerCase().indexOf("geotiff") >= 0) {
                    return formats[i];
                }
            }

            // check for tiff second
            for (var i = 0; i < len; i++) {
                if (formats[i].toLowerCase().indexOf("tiff") >= 0) {
                    return formats[i];
                }
            }

            return null;
        };

        // Internal use only
        WcsCoverage.prototype.getCoverageUrl = function () {
            if (this.capabilities.version === "1.0.0") {
                return this.capabilities.capability.request.getCoverage.get;
            } else if (this.capabilities.version === "2.0.0" || this.capabilities.version === "2.0.1") {
                return this.capabilities.operationsMetadata.getOperationMetadataByName("GetCoverage").dcp[0].getMethods[0].url;
            }
        };

        // Internal use only - copied from WmsUrlBuilder, is there a better place to centralize???
        WcsCoverage.prototype.prepareBaseUrl = function (url) {
            if (!url) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "WcsCoverage", "prepareBaseUrl", "missingUrl"));
            }

            var index = url.indexOf("?");

            if (index < 0) { // if string contains no question mark
                url = url + "?"; // add one
            } else if (index !== url.length - 1) { // else if question mark not at end of string
                index = url.search(/&$/);
                if (index < 0) {
                    url = url + "&"; // add a parameter separator
                }
            }

            return url;
        };

        // Internal use only
        WcsCoverage.indexOf = function(array, propertyName, name) {
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i][propertyName] === name) {
                    return i;
                }
            }

            return -1;
        };

        return WcsCoverage;
    });
