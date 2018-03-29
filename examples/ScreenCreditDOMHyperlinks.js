/*
 * Copyright 2015-2017 WorldWind Contributors
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
requirejs(['./WorldWindShim',
        './LayerManager'],
    function (WorldWind,
              LayerManager) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        var wwd = new WorldWind.WorldWindow("canvasOne");

        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: false},
            {layer: new WorldWind.BMNGLandsatLayer(), enabled: true},
            {layer: new WorldWind.BingAerialLayer(null), enabled: false},
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: false},
            {layer: new WorldWind.BingRoadsLayer(null), enabled: false},
            {layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: false},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        // Create screen credits overlay via browser's DOM.

        // Create div that will contain screen credits.
        var creditsOverlay = document.createElement("div");

        // Set overlay CSS styling
        creditsOverlay.style.position = "absolute";
        creditsOverlay.style.right = "2.7%";
        creditsOverlay.style.bottom = "4%";
        creditsOverlay.style.color = "LightGray";
        creditsOverlay.style.textAlign = "right";
        creditsOverlay.style.opacity = "0.75";

        // Add text credits.
        creditsOverlay.innerHTML =
            "<p>I'm a DOM text string</br>and I contain many lines</br>Web UI haiku.</p>" +
            "<p>" +
                "<a href=\"http://www.maps.bing.com\" target=\"_blank\">I'm a DOM hyperlink</a>" +
            "</p>"
        ;

        // Add image credit.
        creditsOverlay.innerHTML +=
            "<p>" +
                "<a href=\"http://www.maps.bing.com\" target=\"_blank\">" +
                    "<img src=\"../images/powered-by-bing.png\" alt=\"Link to Bing maps\">\n" +
                "</a>" +
            "</p>"
        ;

        // Append overlay as sibling of canvas element.
        wwd.canvas.parentNode.appendChild(creditsOverlay);

        // Create a layer manager for controlling layer visibility.
        var layerManager = new LayerManager(wwd);
    });