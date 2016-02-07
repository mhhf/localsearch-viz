Logs = new Mongo.Collection("logs");
Peer = new Mongo.Collection("peer");


if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

}

if (Meteor.isServer) {
  var dgram = Meteor.npmRequire('dgram')
  var server = dgram.createSocket('udp4');
  Fiber = Npm.require('fibers');
  server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
  });

  server.on('message', Meteor.bindEnvironment(function (msg, remote) {
    var msg = JSON.parse(msg);
    var links = msg.links.map( link => [ link[3][1], link[3][0] ] );
    console.log(links);
    console.log("msg: " + JSON.stringify(msg));
    
    
    var _id = msg.loc[0] +''+ msg.loc[0];
    var peer = Peer.findOne( _id );
    var alive = +(new Date());
    
    Logs.insert({ msg, alive });
    
    switch ( msg.type ) {
      case 'boot':
        !peer && Peer.insert({_id: _id, pos: [msg.loc[1],msg.loc[0]], links:links, alive });
        break;
      case 'leave':
        peer && Peer.remove( _id );
      default:
        !peer && Peer.insert({_id: _id, pos: [msg.loc[1],msg.loc[0]], links:links, alive });
        peer && Peer.update({_id:_id}, {$set: { links: links, alive }})
    }
    
  }));
  

  server.bind(9876, "0.0.0.0");
  Meteor.startup(function () {
    
    Peer.remove({});
    
    setInterval( Meteor.bindEnvironment(function() {
      
      Peer.remove( {alive: {$lt: +(new Date()) - 90000 }} )
      
    }),30000)
    
    
     
    // if( Peer.find().count() === 0 ) {
      // Peer.insert({_id: "61.684800933358986,4.678291126020355", pos: [61.684800933358986,4.678291126020355], links:[[-54.61155768758212,27.487017716359446]]});
      // Peer.insert({_id: "1010", pos: [-54.61155768758212,27.487017716359446], links:[[61.684800933358986,4.678291126020355]] });
    //   Peer.insert({_id: "2030", pos: [20,30], links:[[5.9689839,51.0851625],[10,10]]});
    // }
    
  });
}
