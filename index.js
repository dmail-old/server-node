import http from 'node/http';
import https from 'node/https';

import proto from 'proto';

var Server = proto.extend({
	constructor(requestHandler){
		this.requestHandler = requestHandler;
	},

	onRequest(request, response){
		this.requestHandler(request, response);
	},

	onConnectionOpened(connection){
		this.connections.add(connection);
		connection.on('close', this.onConnectionClosed.bind(this, connection));
	},

	onConnectionClosed(connection){
		this.connections.delete(connection);
	},

	createServer(options){
		var server;

		if( options.secure ){
			server = https.createServer();
		}
		else{
			server = http.createServer();
		}

		return server;
	},

	open(location){
		var url = new URL(location);
		var isHttps = this.protocol === 'https:'; 

		this.connections = new Set();

		this.server = this.createServer({
			secure: isHttps
		});		
		this.server.on('connection', this.onConnectionOpened.bind(this));
		this.server.on('request', this.onRequest.bind(this));

		this.protocol = url.protocol;
		this.hostname = url.hostname;
		this.port = url.port || (isHttps ? 443 : 80);

		return new Promise(function(resolve, reject){
			this.server.listen(this.port, this.hostname, function(error){
				if( error ){
					reject(error);
				}
				else{
					resolve();
				}
			});
		}.bind(this));
	},

	close(){
		return new Promise(function(resolve, reject){
			for(var connection of this.connections){
				connection.destroy();
			}

			if( this.server && this.server_handle ){
				this.server.close(function(error){
					if( error ){
						reject(error);
					}
					else{
						resolve();
					}
				});
			}
			else{
				resolve();
			}
		}.bind(this));
	}
});

export default Server;