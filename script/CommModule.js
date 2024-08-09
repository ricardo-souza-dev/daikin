// communication module
// Below functions should be overwrtten
// call when you want to connect to server
function connect() {
	if(LOCAL) {
		COMM_PORT.connectServer(location.hostname,USER,PASSWD);
	} else {
		COMM_PORT.connectSis(location.hostname,USER,PASSWD);
	}
}
// call when connection is closed
function connectionClosed() {
	showLoginPage();
}
// call when command is received from server
function command_dispatch(command,result,parameter) {
	// evt is JSON object send from server include command
	// command dispatch
	switch(command) {
		case 'login':
			if(result == 'OK') {
				// load main screen
			} else {
				alert(getString('login_failed'));
				COMM_PORT.closeConnection();
			}
			break;
		default:
	}
}

// command cache control
function pushCommand(command,val) {
	COMM_CACHE[command] = val;

	if(SNDTIMER != null) clearTimeout(SNDTIMER);
	SNDTIMER = setTimeout('sendCommand()',1000);
}

// send operation command
function sendCommand() {
	SNDTIMER = null;
	var id = SELECTED_POINT.info.id;
	var com = [id,COMM_CACHE]
	var command = ['operate',[com]];
	console.log(command);
	COMM_PORT.send(command);
	COMM_CACHE = {};
}

////////////////////////////////////////////////
// CommModule 
function CommModule() {
	this.ws = null;
	this.connected = false;
	this.commMon = {};	// key:[command,...]
	this.init = false;
}

CommModule.prototype.connectServer = function(host,user,passwd) {
	$('.top-page').fadeOut(1000);
	var url = "ws://"+host+":"+60000;
	this.connect(url,user,passwd,true);
	this.init = false;
}

CommModule.prototype.connectSis = function(host,user,passwd) {
	var port = 50001;
	if(window.localStorage) {
		GID = window.localStorage.getItem(MODEL+'key');
		SITE_ID = window.localStorage.getItem(MODEL+'siteid');
		if(SITE_ID == 'null') SITE_ID = null;
	}
	this.init = false;
	var url = "wss://"+host+":"+port;
	this.connect(url,user,passwd,false);
}

CommModule.prototype.ready = function() {
	this.init = true;
}

CommModule.prototype.isReady = function() {
	return this.init;
}

CommModule.prototype.connect = function(url, user, passwd,local) {
	var self = this;	// self is used in inner method to access myself

	try {
		if(this.ws == null) {
			this.ws = new WebSocket(url);
			this.ws.onopen = function() {
				self.connected = true;
				if(local == false) {
					com = ['connect',[GID,'remote',SITE_ID]];
					self.ws.send(JSON.stringify(com));
				}
				com = ["login",{"user":user,"passwd":passwd}];
				self.send(com);	// send login command
			}

			this.ws.onmessage = function(evt) {
				if(receive(evt) == false) {
					self.ws.close();
					self.init = false;
				}
			}

			this.ws.onerror = function(evt) {
				alert(getString('sock_err'));	// show message of connection error
				self.ws.close();
				self.init = false;
			}

			// if connection is closed then move to login screen
			this.ws.onclose = function() {
				self.connected = false;
				self.ws = null;
				self.init = false;
				connectionClosed();
			}
		}
	} catch(e) {
		alert(e);
	}
}

CommModule.prototype.send = function(packet) {
	try {
		if(this.connected == true) {
			// first data is ignored when local connection
			// in MSM mode, first packet should be site id
			var site_id = SITE_ID;
			if(site_id == null) site_id = '';
			message = JSON.stringify([site_id,packet]);
			this.ws.send(message);
		} else {
			// exec something if connection is closed
		}
	} catch(e) {
		// message send error
		alert(e);
	}
}

CommModule.prototype.sendMon = function(packet, key) {
	if(this.commMon[key] == null) this.commMon[key] = [packet[0]];
	else this.commMon[key].push(packet[0]);
	this.send(packet);
}

CommModule.prototype.monitoredCom = function(key) {
	return this.commMon[key];
}

CommModule.prototype.removeCom = function(key,com) {
	try {
		this.commMon[key].splice(this.commMon[key].indexOf(com),1);
		return true;
	} catch(e) {
		return false;
	}
}

CommModule.prototype.closeConnection = function() {
	if(this && this.ws) {
		this.ws.close();
	} else {
		// exec somethig if connection is already closed
		connectionClosed();
	}
}

// call when command is received from server
function receive(evt) {
	var data = JSON.parse(evt.data);
	var site_id = data[0];
	if(SITE_ID != null && SITE_ID != site_id) return;
	data = data[1];
	try {
		// evt is JSON object send from server include command
		// command dispatch
		return command_dispatch(data.shift(),data.shift(),data);
	} catch(e) {
//		alert(e);
		return false;
	}
}