/** @jsx React.DOM */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Settings = require('../store/Settings.js');
var setSetting = require('../act/Settings.js').set;

module.exports = React.createClass({
	mixins: [Reflux.listenTo(Settings, 'updateSetting')],
	getInitialState: function(){
		var settings = {};
		_.forIn(Settings.settings, function(vals){
			_.extend(settings, _.mapValues(vals, 'val'));
		});
		return {
			settings: settings,
			selected: _.keys(Settings.settings)[0],
		};
	},
	updateSetting: function(key){
		var settings = {};
		settings[key] = Settings.val;
		this.setState({ settings: settings });
	},
	handleChange: function(setting, key, evt){
		if (setting.type === 'bool')
			setSetting(key, evt.target.checked);
		else
			setSetting(key, evt.target.value);
	},
	renderControl: function(s, key){
		switch (s.type){

		case 'text':
			return <input type="text" value={Settings[key]} onChange={_.partial(this.handleChange, s, key)} />;
		case 'password':
			return <input type="password" value={Settings[key]} onChange={_.partial(this.handleChange, s, key)} />;
		case 'bool':
			return <input type="checkbox" checked={Settings[key]} onChange={_.partial(this.handleChange, s, key)} />;
		}
	},
	renderSetting: function(s, key){
		return (<div className="settingControl" key={key}>
			<span>{s.name}</span>
			{this.renderControl(s, key)}
		</div>);
	},
	render: function(){
		return (<div className="lobbySettings">
			{_.keys(Settings.settings).map(function(category){
				return (
				<div
					className={'settingCategory' + category === this.state.selected ? ' selected' : ''}
					key={category}>
						{_.map(Settings.settings[category], this.renderSetting)}
				</div>);
			}.bind(this))}
		</div>);
	}
});
