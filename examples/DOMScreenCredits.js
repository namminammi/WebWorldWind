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

        // Create a layer manager for controlling layer visibility.
        var layerManager = new LayerManager(wwd);

        // Create screen credits overlay via browser's DOM.

        // Create div that will contain screen credits.
        var creditsOverlay = document.createElement("div");
        creditsOverlay.setAttribute("id", "creditsOverlay"); // Not required, but helpful in the developer tools.

        // Set overlay CSS styling in order to (mostly) imitate current screen credits implementation.
        creditsOverlay.style.position = "absolute"; // Required for the overlay to be positioned over the container.
        creditsOverlay.style.right = "0%";
        creditsOverlay.style.bottom = "0%";
        creditsOverlay.style.color = "DimGray";
        creditsOverlay.style.textAlign = "right";
        creditsOverlay.style.opacity = "0.75";

        // Add text credit and hyperlink.
        creditsOverlay.innerHTML =
            "<p>I'm a DOM text string</br>and I contain many lines</br>Web UI haiku.</p>" +
            "<p>" +
                "<a href=\"http://www.maps.bing.com\" target=\"_blank\">I'm a DOM hyperlink</a>" +
            "</p>"
        ;

        // Add image credit that also functions as hyperlink.
        creditsOverlay.innerHTML +=
            "<p>" +
                "<a href=\"http://www.maps.bing.com\" target=\"_blank\">" +
                    "<img src=\"../images/powered-by-bing.png\" alt=\"Link to Bing maps\">\n" +
                "</a>" +
            "</p>"
        ;

        // Create new parent node that will serve as the container of both the canvas and the overlay div.
        var container = document.createElement("div");
        container.setAttribute("id", "WorldWindContainer");

        // Attempting to make the new container layout identical to the WorldWindow canvas, with the intention
        // of avoiding disruption of the application's HTML layout, whatever it may be.
        container.style.height = wwd.canvas.style.height;
        container.style.width = wwd.canvas.style.width;
        container.style.display = "inline-flex";

        // Setting container's position as required for the overlay.
        container.style.position = "relative";

        // Replace application-defined canvas parent node with our new container, hopefully without messing
        // with the application's layout.
        wwd.canvas.parentNode.replaceChild(container, wwd.canvas);

        // Set WorldWindow canvas and credits overlay as child nodes of our container.
        container.appendChild(wwd.canvas);
        container.appendChild(creditsOverlay);
    });