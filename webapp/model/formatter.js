sap.ui.define([

], 
    function() {
        'use strict';
        return{
            camelCase : function (sValue) {
                //FENERBAHÇE ---> Fenerbahçe
                return sValue.replace(/([^\s:\-])([^\s:\-]*)/g,function($0,$1,$2){

                    return $1.toUpperCase()+$2.toLowerCase();

                });

            },

            dateFormat : function(sValue){
                //20220713 ---> 13.07.2022
                return sValue.substring(6, 8) + '.' +
                            sValue.substring(4, 6) + '.' + 
                                sValue.substring(0, 4);
            },

            footUsed : function(sValue){
                if (sValue == 'R') {
                    return 'Right';
                }
                return 'Left';
            },

            currencyFormat : function (sValue) {
                //100000 ---> $100,000.00
                let aVal = sValue.split(" ");
                return Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: aVal[1],
                }).format(aVal[0]);
            }
        }
    });