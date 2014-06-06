///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/User',
	[
		"dojo/_base/declare",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
	],
	function(declare,
		array,
		domConstruct,domAttr,
		lang, topic,
		event
		){
	return declare("User", null, {
	
	name: '',
	
	country: '',
	cpu: '',
	
	status: null,
	battleStatus: null,
	
	//lobby status
	isInGame: null,
	inGameSince: null,
	isAway: null,
	awaySince: '',
	isAdmin: null,
	isBot: null,
	rank: null,
		
	//battle status
	isReady: null,
	teamNumber: null,
	allyNumber: null,
	isSpectator: null,
	syncStatus: null,
	side: 0,
	teamColor: '0',
	r: null,
	g: null,
	b: null,
	
	//bot stuff
	owner: '',
	ai_dll: '',
	
	
	//extra
	isHost: false,
	isInBattle: false,
	
	battleId: 0,
	scriptPassword: '',
	skill: '',
	elo: '',
	
	constructor: function(/* Object */args){
		declare.safeMixin(this, args);
	},
	
	toTestString: function()
	{
		return this.name + ' || t:' + this.teamNumber + '; a:' + this.allyNumber;
	},
	toString: function()
	{
		if(this.owner !== '')
		{
			return this.name + ' (' + this.ai_dll + ') (' + this.owner + ') ';
		}
		return this.name;
	},
	
	displayName: function()
	{
		if(this.owner !== '')
		{
			return this.name + ' (' + this.ai_dll + ') (' + this.owner + ') ';
		}
		return this.name;
	},
	
	
	
	//set the status number
	setStatus: function(status)
	{
		var isAdmin;
		var isBot;
		var rank;
		var isInGame;
		var isAway;
		
		isAdmin = (status & 32) > 0;
		isBot = (status & 64) > 0;
		rank = (status & 28) >> 2;
		
		isInGame = (status & 1) > 0;
		isAway = (status & 2) > 0;
		
		this.setStatusVals({
			status: status,
			
			isAdmin: isAdmin,
			isBot: isBot,
			rank: rank,
			isInGame: isInGame,
			isAway: isAway
		})
	},
	
	//pass values in using an object
	setStatusVals: function(vals, fake)
	{
		var oldUser = declare.safeMixin({}, this);
		declare.safeMixin(this, vals);
		this.setAwaySince(oldUser.isAway)
		this.setInGameSince(oldUser.isInGame)
		this.updateStatusNumbers();
		if( !fake )
		{
			topic.publish('Lobby/battle/playerstatus', {name: this.name, user: this, userOld: oldUser } );
		}
	},
	
	setAwaySince: function( old )
	{
		var date;
		date = new Date();
		
		if (this.isAway && !old) this.awaySince = date.toLocaleTimeString();
		if (!this.isAway) this.awaySince = '';
	},
	setInGameSince: function( old )
	{
		if (this.isInGame && !old) this.inGameSince = new Date();
		if (!this.isInGame) this.inGameSince = null;
	},
	
	processBattleStatus: function()
	{
		var syncStatuses, status;
		
		status = this.battleStatus;
		
		syncStatuses = [
			'Unknown',
			'Synced',
			'Unsynced'
		];
		
		this.isReady = (status & 2) > 0;
		this.teamNumber = (status >> 2) & 15;
		this.allyNumber = (status >> 6) & 15;
		this.isSpectator = (status & 1024) == 0;
		this.syncStatus = syncStatuses[ (status >> 22) & 3 ] ;
		this.side = (status >> 24) & 15;
	},
	
	//set the battle status number and color number
	setBattleStatus: function(status, color)
	{
		this.battleStatus = status;
		this.teamColor = color;
		this.processBattleStatusAndColor();
	},
	
	processBattleStatusAndColor: function()
	{
		var oldUser = declare.safeMixin({}, this);
		this.processTeamColor();
		this.processBattleStatus();
		topic.publish('Lobby/battle/playerstatus', {name: this.name, user: this, userOld: oldUser } );
	},
	
	
	sendStatus: function()
	{
		var smsg = "MYSTATUS " + this.status;
		topic.publish( 'Lobby/rawmsg', {msg: smsg } );
	},
	
	sendBattleStatus: function(bot)
	{
		var smsg, sendString;
		sendString = bot ? ('UPDATEBOT ' + this.name.replace('<BOT>', '') ) : 'MYBATTLESTATUS'
		var smsg = sendString + ' ' + this.battleStatus + ' ' + this.teamColor;
		topic.publish( 'Lobby/rawmsg', {msg: smsg } );
	},
	
	
	//returns the status number
	updateStatusNumbers: function()
	{
		var status, battleStatus, syncStatusIndices;
		
		syncStatusIndices = {
			Unknown: '0',
			Synced: '1',
			Unsynced: '2'
		};
		
		battleStatus = 0;
		if (this.isReady) battleStatus |= 2;
		battleStatus += (this.teamNumber & 15) << 2;
		battleStatus += (this.allyNumber & 15) << 6;
		if (!this.isSpectator) battleStatus |= 1024;
		battleStatus += ( parseInt( syncStatusIndices[this.syncStatus] ) & 3) << 22;
		battleStatus += (this.side & 15) << 24;
		this.battleStatus = battleStatus;
		
		
		//status = this.status;
		status = 0;
		status |= this.isInGame ? 1 : 0;
		status |= this.isAway ? 2 : 0;
		this.status = status;
		
	},
	
	setTeamColor: function(val)
	{
		var r,g,b, color;
		
		r = val.substr(1,2);
		g = val.substr(3,2);
		b = val.substr(5,2);
		r = parseInt(r, 16);
		g = parseInt(g, 16);
		b = parseInt(b, 16);
		
		var color = b;
		color = color << 8;
		color += g;
		color = color << 8;
		color += r;
		
		this.teamColor = color;
	},
	processTeamColor: function()
	{
		var hr, hg, hb;
		
		this.r = this.teamColor & 255;
		this.g = (this.teamColor >> 8) & 255;
		this.b = (this.teamColor >> 16) & 255;
		
		this.hexColor = 'FFFFFF';
		if( this.r !== null )
		{
			hr = this.r.toString(16);
			hg = this.g.toString(16);
			hb = this.b.toString(16);
			if( hr.length < 2 ) hr = '0' + hr;
			if( hg.length < 2 ) hg = '0' + hg;
			if( hb.length < 2 ) hb = '0' + hb;
			this.hexColor = hr+hg+hb;
		}
		
		
	},
	
	getTeamColorHex: function()
	{
		//convert this.r, this.g and this.b to hex string
		
	},
	
	getOsIcon: function()
	{
		var cpu = this.cpu;
		var src, title
		src = '';
		if( array.indexOf( ['7777', '9998', '6667' ], cpu ) !== -1 )
		{
			src = "img/windows.png";
			title = "Microsoft Windows";
		}
		else if( array.indexOf( ['7778', '9999', '6668' ], cpu ) !== -1 )
		{
			src = "img/linux.png";
			title = "Linux";
		}
		else if( array.indexOf( ['7779', '9997' ], cpu ) !== -1 )
		{
			src = "img/mac.png";
			title = "MacOS";
		}
		if( src === '' )
		{
			return false;
		}
		return domConstruct.create( 'img', {src: src,  title: title, width: "16"} );
		//return domConstruct.create( 'img', {src: src,  align: "right",  title: title, width: "16"} );
	},
	
	getBattleIcon: function(noLink)
	{
		var joinLink;
		var img;
		
		joinLink = domConstruct.create('a', {
			href: '#',
			onclick: lang.hitch(this, function( battleId, e ){
				event.stop(e);
				topic.publish('Lobby/battles/joinbattle', battleId );
				return false;
			}, this.battleId )
		} );
	
		if( this.isInGame )
		{
			img = domConstruct.create( 'img', {
				src: "img/battle.png",
				//align: "right",
				title: "In a game" + (!noLink ? '. Click to join.' : ''),
				width: '16',
				onmouseover: function()
				{
					var curDate = new Date();
					domAttr.set( this, 'width', 18 );
					domAttr.set( this, 'title', "In a game since " +
						(this.inGameSince ? this.inGameSince.toLocaleTimeString() + ' (' +
						Math.floor( (curDate - this.inGameSince) / 60000 ) + ' mins)' : '') +
						(!noLink ? '. Click to join.' : '') );
				},
				onmouseout: function() { domAttr.set( this, 'width', 16 ) },
			});
		}
		else if( this.isInBattle )
		{
			img = domConstruct.create( 'img', {
				src: "img/battlehalf.png",
				//align: "right",
				title: "In a battle room. Click to join.",
				width: '16',
				onmouseover: function() { domAttr.set( this, 'width', 18 ) },
				onmouseout: function() { domAttr.set( this, 'width', 16 ) },
			});
		}
		else
		{
			return false;
		}
		if( noLink )
		{
			return img;
		}
		domConstruct.place( img, joinLink );
		
		var div = domConstruct.create('div', {style:{display:'inline-block'} } );
		
		
		domConstruct.place( joinLink, div );
		return div;
		//return joinLink;
	},
	getLobbyClientIcon: function()
	{
		var src, title
		var cpu = this.cpu
		src = '';
		if( array.indexOf( ['7777', '7778', '7779'], cpu ) !== -1 )
		{
			src = "img/blobby2icon-small.png";
			title = "Spring Web Lobby";
		}
		else if( array.indexOf( ['6666', '6667', '6668'], cpu ) !== -1 )
		{
			src = "img/zk_logo_square.png";
			title = "Zero-K Lobby";
		}
		else if( array.indexOf( ['9997', '9998', '9999'], cpu ) !== -1 )
		{
			src = "img/notalobby.png";
			title = "NotaLobby";
		}
		else if( array.indexOf( ['8484'], cpu ) !== -1 )
		{
			src = "img/mlclient.ico";
			title = "mlclient";
		}
		if( src === '' )
		{
			return false;
		}
		return domConstruct.create( 'img', {src: src, title: title, width: "16"} );
	},
	
	getFlag: function()
	{
		var countryName;
		var value = this.country;
		countryName = value in countryCodes ? countryCodes[value] : 'country not found' ;
		if(value === '??')
		{
			return domConstruct.create('img', {src: 'img/flags/unknown.png', title: 'Unknown Location', width: 16} )
		}
		return domConstruct.create('img', {src: 'img/flags/'+value.toLowerCase()+'.png', title: countryName, width: 16} )
	},
	
}); }); //declare User	
