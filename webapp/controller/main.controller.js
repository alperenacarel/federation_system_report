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
        
        var aSelectItems = ["TETXT", "SPRNM", "SPRLN"];

        return Controller.extend("federationreport.controller.main", { 
            formatter : formatter,

            onInit: function () {
                this._setScreenMultiInput();
                this._setSelectItems();
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

            _setSelectItems: function () {
                var aItems = [];
                
                aSelectItems.map( item => {
                    var sVal = {};
                    
                    sVal.Id = item;
                    sVal.Text = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(item.toLowerCase());

                    aItems.push(sVal);
                })

                this.getView().byId("selectFilter").setSelectedKey("TETXT");
                this.setPlaceholder("TETXT");

                var oModel = new JSONModel(aItems);
                this.getView().setModel(oModel, "SelectItems");
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

                this._getBusyDialog().open();

                this.getOwnerComponent().getModel().read("/PlayerSet", {
                    filters: aFilter,
                    async: true,
                    success: function (oData) {
                        var aData = oData.results;
                        aData.map( item => {
                            item.VALUE = item.VALUE + ' ' + item.CURRY;
                            item.SWAGE = item.SWAGE + ' ' + item.CURRY;
                        });
                        that.closeBusyDialog();

                        var oModel = new JSONModel(aData);
                        that.getView().setModel(oModel, "GeneralTable");
                    },
                    error: function(err){
                        that.closeBusyDialog();
                        MessageToast.show(err.message);
                    }
                })
            },
            
            onValueHelpRequest: function (oEvent) {
                var that = this;
                var sId = oEvent.getSource().getId();

                this._getBusyDialog().open();

                var sDomname = sId.split("---")[1];
                var sDomname = sDomname.split("--")[1];
                var aFilter  = [];

                aFilter.push(new Filter("Column3", 
                FilterOperator.EQ, 
                sDomname));
            
                this.getOwnerComponent().getModel().read("/PlayerSearchHelpSet", {
                    filters: aFilter,
                    async: true,
                    success: function (oData) {
                        var aHelp = [];
                        var aData = oData.results;

                        aData.map(item => {
                            var sVal = {};
                            sVal.Id   = item.Column1;
                            sVal.Text = item.Column2;
                            sVal.Name = item.Column3;
                            aHelp.push(sVal);
                        })

                        that.closeBusyDialog();

                        var oModel = new JSONModel(aHelp);
                        that.getView().setModel(oModel, "SearchHelpTable");

                        var oDialog = that._getSearchDialog();
                        that.getSelectedValues(sDomname);
                        oDialog.open();
                    },
                    error: function (err) {
                        that.closeBusyDialog();
                        MessageToast.show(err.message);
                    }
                })
            },

            setSelectedValues: function () {
                var aPaths = this._oSearchDialog._oTable._aSelectedPaths;
                var oInput = "";

                for (let i = 0; i < aPaths.length; i++) {
                    const element = aPaths[i];
                    var bFlag = true; 
                    var sVar = this.getView().getModel("SearchHelpTable")
                                        .getData()[element.substring(1, element.length)]
                    
                    if (!oInput) {
                        oInput  = this.getView().byId(sVar.Name);
                    }
                    
                    oInput.getTokens().map( item => {
                        if( item.getKey() == sVar.Id ){
                            bFlag = false;
                        }
                    })

                    if (bFlag) {
                        oInput.addToken(new Token({ 
                                                    text: sVar.Id,
                                                    key: sVar.Id
                                                }));
                    }
                }

                this._oSearchDialog.destroy();
            },

            filterSearchValues: function (oEvent) {
                var aFilter = [];
                var sQuery  = oEvent.getSource()._sSearchFieldValue;
                var oTable  = this._oSearchDialog._oTable;

                if (sQuery && sQuery.length > 0) {
                    aFilter = [
                        new Filter([
                            new Filter("Id", FilterOperator.Contains, sQuery),
                            new Filter("Text", FilterOperator.Contains, sQuery),
                    ])];
                }
                oTable.getBinding("items").filter(aFilter, "Control");
            },

            getSelectedValues: function (sDomname) {
                var aValues = this.getView().byId(sDomname).getTokens();
                var aData   = this.getView().getModel("SearchHelpTable").getData();

                for (let i = 0; i < aValues.length; i++) {
                    aData.map( item => {
                        if (item.Id == aValues[i].getKey()) {
                            this._oSearchDialog._oTable._aSelectedPaths
                                                .push("/" + aData.indexOf(item));       
                        }
                    });                          
                }
            },

            _getSearchDialog: function () {
                this._oSearchDialog = sap.ui.getCore().byId();		
                if (!this._oSearchDialog) {				
                    this._oSearchDialog = sap.ui.xmlfragment("federationreport.fragments.searchHelp", this); 
                    this.getView().addDependent(this._oSearchDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSearchDialog);	
                }			
                return this._oSearchDialog;	
            },

            pressCloseDialog: function () {
                if(this._oSearchDialog){
                    var oModel = new JSONModel([]);
                    this.getView().setModel("SearchHelpTable", oModel)
                    this._oSearchDialog.destroy();
                }
            },

            _getBusyDialog: function () {
                this._oBusyDialog = sap.ui.getCore().byId("busyDialog");		
                if (!this._oBusyDialog) {				
                    this._oBusyDialog = sap.ui.xmlfragment("federationreport.fragments.busyDialog", this); 
                    this.getView().addDependent(this._oBusyDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oBusyDialog);	
                }			
                return this._oBusyDialog;	
            },

            closeBusyDialog: function () {
                if (this._oBusyDialog) {
                    this._oBusyDialog.destroy();
                }
            },

            onSearch: function(oEvent){
                var sQuery  = oEvent.getSource().mProperties.value;
                var aFilter = [];
                var sKey    = this.getView().byId("selectFilter").getSelectedItem().mProperties.key

                if (sQuery && sQuery.length > 0) {
                    aFilter = [
                        new Filter(sKey, FilterOperator.Contains, sQuery)];
                }
                this.getView().byId("generalTable").getBinding("items").filter(aFilter, "Application");
            },

            onChangeSelected: function(){
                this.setPlaceholder(this.getView().byId("selectFilter").getSelectedItem().mProperties.key);
                this.getView().byId("listSearch").fireLiveChange();
            },

            setPlaceholder: function(sSelect){
                var sText = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sSelect.toLowerCase());
                this.getView().byId("listSearch").setPlaceholder(sText);
            }
        });
    });
