sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/m/Token",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
	Token,
	Filter,
	FilterOperator,
	JSONModel,
	MessageToast,
	formatter) {
        "use strict";
        var aMultiInput = ["SPRID", "TEAID", "SPRNM",
                            "SPRLN", "SLAND", "PSTION"];

        return Controller.extend("federationreport.controller.main", { 
            formatter : formatter,

            onInit: function () {
                this._setScreenMultiInput();
            },

            onExpand: function () {
                var mContainer = this.getView().byId("scrollContainer");
                if(!this.getView().byId("idPanel").getExpanded()){
                    return mContainer.setHeight("85%");
                }
                return mContainer.setHeight("50%");
            },

            onPressShow: function(){
                var aFilter = this._setFilter();
                this._getData(aFilter);
            },

            onPressClear: function(){
                for (let index = 0; index < aMultiInput.length; index++) {
                    this.getView().byId(aMultiInput[index]).removeAllTokens();
                }
                this.getView().byId("bDateLow").setValue(new Date());
                this.getView().byId("bDateHigh").setValue(new Date());
            },

            _setScreenMultiInput: function () {
                for (var i = 0; i < aMultiInput.length; i++) {
                    this.getView().byId(aMultiInput[i]).addValidator(function(args) {
                        var text = args.text;
                        return new Token({
                            key: text,
                            text: text
                        });
                    });
                };
            },

            _setFilter: function () {
                var aFilter = [];
                var dBDateLow = this.getView().byId("bDateLow").getValue();
                var dBDateHigh = this.getView().byId("bDateHigh").getValue();
                
                for (let i = 0; i < aMultiInput.length; i++) {                    
                    var oInput = this.getView().byId(aMultiInput[i]);
                    for (let j = 0; j < oInput.getTokens().length; j++) {
                        aFilter.push(new Filter(aMultiInput[i], 
                                                    FilterOperator.EQ,  
                                                        oInput.getTokens()[j].getKey()));
                    }; 
                };

                if(!dBDateLow && !dBDateHigh){
                    return aFilter;
                }else if(dBDateLow && !dBDateHigh){
                    aFilter.push(new Filter("BDATE",
                                                FilterOperator.EQ, 
                                                    dBDateLow));
                }else if( ( !dBDateLow && dBDateHigh ) || 
                            ( dBDateLow && dBDateHigh ) ){
                    aFilter.push(new Filter("BDATE", 
                                                FilterOperator.BT, 
                                                    dBDateLow, 
                                                        dBDateHigh));
                };

                return aFilter;
            },

            _getData: function (aFilter) {
                var that = this; 
                this.getOwnerComponent().getModel().read("/PlayerSet", {
                    filters: aFilter,
                    async: true,
                    success: function (oData) {
                        for (let index = 0; index < oData.results.length; index++) {
                            oData.results[index].VALUE = oData.results[index].VALUE + ' ' + oData.results[index].CURRY; 
                            oData.results[index].SWAGE = oData.results[index].SWAGE + ' ' + oData.results[index].CURRY; 
                        };
                        var oModel = new JSONModel(oData.results);
                        that.getView().setModel(oModel, "GeneralTable");
                    },
                    error: function(err){
                        MessageToast.show(err.message);
                    }
                })
            },

            onValueHelpRequest: function (oEvent) {
                var that = this;
                var sId = oEvent.getSource().getId();
                
                if( sId.search("SLAND") != -1 ){
                    this.getOwnerComponent().getModel().read("/HT005LandSet", {
                        async: true,
                        success: function (oData) {
                            var aHelp = [];
                            for (let i = 0; i < oData.results.length; i++) {
                                var sVal = {};
                                sVal.Id = oData.results[i].Land1;
                                sVal.Text = oData.results[i].Landx;
                                sVal.Name = "SLAND";
                                aHelp.push(sVal);
                            }
                            var oModel = new JSONModel(aHelp);
                            that.getView().setModel(oModel, "SearchHelpTable");
                            that._getSearchDialog().open();
                        },
                        error: function (err) {
                            MessageToast.show(err.message);
                            return;
                        }
                    })
                }else{
                    var sDomname = sId.split("---")[1];
                    var sDomname = sDomname.split("--")[1];
                    var aFilter  = [];
                    
                    if ( sDomname == "TEAID" ) {
                        sDomname = "TEAID";
                    }else if( sDomname == "SPRID" ){
                        sDomname = "SPRID";
                    }else if( sDomname == "PSTION" ){
                        sDomname = "PSTION";
                    }

                    aFilter.push(new Filter("Column3", 
                                                FilterOperator.EQ, 
                                                    sDomname));

                    this.getOwnerComponent().getModel().read("/PlayerSearchHelpSet", {
                        filters: aFilter,
                        async: true,
                        success: function (oData) {
                            var aHelp = [];
                            for (let i = 0; i < oData.results.length; i++) {
                                var sVal = {};
                                
                                sVal.Id = oData.results[i].Column1;
                                sVal.Text = oData.results[i].Column2;
                                sVal.Name = oData.results[i].Column3;
                                aHelp.push(sVal);

                                var oModel = new JSONModel(aHelp);
                                that.getView().setModel(oModel, "SearchHelpTable");
                                that._getSearchDialog().open();
                            }
                        },
                        error: function (err) {
                            MessageToast.show(err.message);
                        }
                    })
                }
            },

            _getSearchDialog: function () {
                this._oSearchDialog = sap.ui.getCore().byId("searchDialog");		
                if (!this._oSearchDialog) {				
                    this._oSearchDialog = sap.ui.xmlfragment("federationreport.fragments.searchHelp", this); 
                    this.getView().addDependent(this._oSearchDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSearchDialog);	
                }			
                return this._oSearchDialog;	
            },

            setSelectedValues: function () {
                var aPaths = this._oSearchDialog._oTable._aSelectedPaths;
                var oInput = "";

                for (let i = 0; i < aPaths.length; i++) {
                    const element = aPaths[i];
                    var sVar = this.getView().getModel("SearchHelpTable")
                                        .getData()[element.substring(1, element.length)]
                    
                    if (!oInput) {
                        oInput  = this.getView().byId(sVar.Name);
                    }

                    oInput.addToken(new Token({text: sVar.Id, key: sVar.Id}));
                }

                this._oSearchDialog.destroy();
            },

            pressCloseDialog: function () {
                if(this._oSearchDialog){
                    var oModel = new JSONModel([]);
                    this.getView().setModel("SearchHelpTable", oModel)
                    this._oSearchDialog.destroy();
                }
            },

            filterSearchValues: function (oEvent) {
                var aFilter = [];
                var sQuery = oEvent.getSource()._sSearchFieldValue;
                var oTable = this._oSearchDialog._oTable;

                if (sQuery && sQuery.length > 0) {
                    aFilter = [
                        new Filter([
                            new Filter("Id", FilterOperator.Contains, sQuery),
                            new Filter("Text", FilterOperator.Contains, sQuery),
                    ])];
                }
                oTable.getBinding("items").filter(aFilter, "Control");
            }
        });
    });
