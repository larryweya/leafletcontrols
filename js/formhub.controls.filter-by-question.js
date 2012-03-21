L.Control.FilterByQuestion = L.Control.extend({
    options: {
        collapsed: true,
        position: 'topright',
        labelText: 'Select a question to filter by'
    },

    initialize: function (originalLayer, questions, url, options) {
        if(!questions.hasOwnProperty('length') || questions.length < 1)
            throw new Error('You must provide at least one question.');

        /// keep track of original layer that has all data to swap it in and out
        this._originalLayer = originalLayer;
        this._questions = questions;
        this._url = url;
        this._layer = new L.GeoJSON(null, {
            pointToLayer: function (latlng){
                var marker = new L.Marker(latlng, {
                    icon: new mapMarkerIcon()
                });
                return marker;
            }
        });

        L.Util.setOptions(this, options);
    },

    onAdd: function (map) {
        this._map = map;
        this._map.addLayer(this._layer);
        this._initLayout();

        return this._container;
    },

    getContainer: function () {
        return this._container;
    },

    _initLayout: function () {
        this._container = L.DomUtil.create('div', 'leaflet-control-layers');
        if (!L.Browser.touch) {
            L.DomEvent.disableClickPropagation(this._container);
        }

        /// add a form
        this._form = L.DomUtil.create('form', 'formhub-control-layers-form', this._container);

        /// create a div for the question with the form as the parent
        this._selectContainer = L.DomUtil.create('div', 'formhub-control-question-list', this._form);


        var label = L.DomUtil.create('label', '', this._form);
        label.appendChild(document.createTextNode(this.options.labelText));

        /// and the select
        this._select = L.DomUtil.create('select', 'formhub-control-question-select', this._form);
        this._select.name = 'select-one-question';
        this._select.add(new Option('All', '', true));
        for(var i=0;i<this._questions.length;i++)
        {
            var question = this._questions[i];
            if(!question.hasOwnProperty('url') || !question.hasOwnProperty('q'))
                throw new Error('Questions must be in the form {url: \'/odk_viewer/select_one_filter/1234\', q: \'Question...?\'}');
            this._select.add(new Option(question.q, question.url, true));
        }

        /// add change event to select
        L.DomEvent.addListener(this._select, 'change', this._onSelectChange, this);
    },

    _onSelectChange: function(evt) {
        // get the question id
        var url = this._select.options[this._select.selectedIndex].value;

        // if url is blank, simply hide other layers and show the layer with all markers, otherwise use the url to load geojson data
        if(url)
        {
            this._loadUrl(url);
        }
        else
        {
            this._map.removeLayer(this._layer);
            this._map.addLayer(this._originalLayer);
        }
    },

    _loadUrl: function(url) {
        var thisControl = this;
        $.get(url, function(data){
            thisControl._updateMap(data);
        });
    },

    _updateMap: function(data) {
        // TODO: once we have multiple filter controls we need a way of removing ALL layers from all controls and only showing ours, perhaps a master control that keeps track of the active filter
        this._map.removeLayer(this._originalLayer);
        this._map.removeLayer(this._layer);
        this._layer = new L.GeoJSON(data, {
            pointToLayer: function (latlng){
                var marker = new L.Marker(latlng, {
                    icon: new mapMarkerIcon()
                });
                return marker;
            }
        });
        this._map.addLayer(this._layer);
    },

    _expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
    },

    _collapse: function () {
        this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
    }
});