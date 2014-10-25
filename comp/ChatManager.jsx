/** @jsx React.DOM
 *
 * This brings other chat components together and feeds them data.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Chat = require('../act/Chat.js');
var ChatStore = require('../store/Chat.js');

var ChatLog = require('./ChatLog.jsx');
var ChatInput = require('./ChatInput.jsx');
var ChatButtons = require('./ChatButtons.jsx');
var UserList = require('./UserList.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ChatStore, 'setState', 'setState')],
	getInitialState: function(){
		return {
			logs: {}, // channels are prefixed with #
			users: {},
			topic: null,
			needAttention: {},
			selected: '', // this uses # too
		};
	},
	handleSelect: function(val){
		Chat.selectLogSource(val);
	},
	handleSend: function(val){
		if (this.state.selected.match(/^#/))
			Chat.sayChannel(this.state.selected.slice(1), val);
		else
			Chat.sayPrivate(this.state.selected, val);
	},
	getTabClass: function(tab){
		return React.addons.classSet({
			'selected': tab === this.state.selected,
			'attentionLow': this.state.needAttention[tab] === ChatStore.AttentionLevel.LOW,
			'attentionHigh': this.state.needAttention[tab] === ChatStore.AttentionLevel.HIGH,
		});
	},
	render: function(){
		var log = this.state.logs[this.state.selected] || [];
		var users = this.state.users;
		var topic = this.state.topic;

		// List channels first and private convos last.
		var channels = _.filter(_.keys(this.state.logs), function(name){ return name[0] === '#'; });
		var privates = _.filter(_.keys(this.state.logs), function(name){ return name[0] !== '#'; });
		return (<div className="chatManager">
			<div className="chatLeft">
			<ul className="chatTabs">
				{_(channels.concat(privates)).map(function(chan){
					return (<li
						onClick={_.partial(this.handleSelect, chan)}
						className={this.getTabClass(chan)}
						key={chan}>
						{chan}
					</li>);
				}.bind(this))}
			</ul>
			<ChatButtons selected={this.state.selected} />
			</div>
			<div className={'chatMain' + (users ? '' : ' noUserList') + (topic ? '' : ' noTopic')}>
				{topic ? <div className="chatTopic">
					<div className="topicText">{topic.text.replace(/\\n/g, '\n')}</div>
					<div className="topicInfo">
						Topic set by {topic.author} on {topic.time.toLocaleString()}
					</div>
				</div> : null}
				<ChatLog log={log} />
				<ChatInput onSend={this.handleSend} />
			</div>
			{users ? <UserList users={users} /> : null}
		</div>);
	}
});