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
define([
    'src/formats/kml/styles/KmlStyleMap',
    'src/formats/kml/util/Pair',
    'src/util/XmlDocument'
], function (
    KmlStyleMap,
    Pair,
    XmlDocument
) {
    "use strict";
    describe("KmlStyleMapTest",function(){

            var validKml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<kml xmlns=\"http://www.opengis.net/kml/2.2\">" +
                "<StyleMap>" +
                "   <Pair></Pair>" +
                "</StyleMap>" +
                "</kml>";
            var kmlRepresentation = new XmlDocument(validKml).dom();
            var styleMap = new KmlStyleMap({objectNode:
                kmlRepresentation.getElementsByTagName("StyleMap")[0]});
        it("should have the prototype properties of Pair", function(){
            expect(styleMap.kmlPairs[0] instanceof Pair).toBeTruthy();
        });

        });
    });