/** @jsx React.DOM */

'use strict'

window.QWeblobbyApplet && QWeblobbyApplet.init();

var ConnectButton = require('./comp/ConnectButton.jsx');
var UserList = require('./comp/UserList.jsx');
var ChatManager = require('./comp/ChatManager.jsx');

var App = React.createClass({
	render: function(){
		return (<div>
			<p><ConnectButton /></p>
			<div style={ {height: '60%', width: '90%', position: 'absolute'} }>
				<ChatManager />
			</div>
		</div>);
	}
});

React.renderComponent(<App />, document.getElementById('main'));