var database = firebase.database()
var connectedRef = database.ref('.info/connected')
var connectionsList = database.ref('/connections')
var chatRef = database.ref('/Chat')
var connectID = ''

function resetGame(winner, player){
  database.ref('/GameState').update({
    pOneChoice: "",
    pTwoChoice: "",
  })
  database.ref().update({paused: false})
  if(connectID === winner){
    database.ref('/GameState').once('value', (snap)=>{
      var wins = snap.val()[player].wins
      wins++
      database.ref(`/GameState/${player}`).update({wins: wins})
    })
  }
  $('#game-results').text('Choose your weapon!')
}

// When a user connects to the database / website
connectedRef.on('value', (snap)=>{
  if(snap.val()){
    var con = connectionsList.push({
      name: 'Anonymous',
      wins: 0,
    })
    connectID = con.key
    con.onDisconnect().remove()
  }
})
// When ANY information changes in the database
database.ref().on('value', (snap)=>{

})
// When any data in the gamestate changes
database.ref('/GameState').on('value', (snap)=>{
  // console.log(snapshot.val())
  $('#player-one-active').text(snap.val().playerOne.id !== '' ? snap.val().playerOne.name : "Available Player Slot!")
  $('#player-one-wins').text(`Wins: ${snap.val().playerOne.wins}`)
  $('#player-two-active').text(snap.val().playerTwo.id !== '' ? snap.val().playerTwo.name : "Available Player Slot!")
  $('#player-two-wins').text(`Wins: ${snap.val().playerTwo.wins}`)

  var playerOneChoice = snap.val().pOneChoice
  var playerTwoChoice = snap.val().pTwoChoice
  if(snap.val().playerOne.id !== '' && snap.val().playerTwo.id !== ''){
    $('#game-results').text('Choose your weapon!')
  }
  if(playerOneChoice !== '' && playerTwoChoice !== ''){
    var curPlayerOneWins = snap.val().playerOne.wins
    var curPlayerTwoWins = snap.val().playerTwo.wins
    var winner
    var player
    database.ref().update({paused: true})
    if(playerOneChoice === playerTwoChoice){
      //PlayersDraw
      $('#game-results').text('DRAW!')
    } else if (playerOneChoice === 'rock' && playerTwoChoice === 'paper'){
      //Player Two Wins
      $('#game-results').text('Player Two Wins!')
      winner = snap.val().playerTwo.id
      player = 'playerTwo'
    } else if (playerOneChoice === 'rock' && playerTwoChoice === 'scissor'){
      //Player One Wins
      $('#game-results').text('Player One Wins!')
      winner = snap.val().playerOne.id
      player = 'playerOne'
    } else if (playerOneChoice === 'paper' && playerTwoChoice == 'rock'){
      //Player One wins
      $('#game-results').text('Player One Wins!')
      winner = snap.val().playerOne.id
      player = 'playerOne'
    } else if (playerOneChoice === 'paper' && playerTwoChoice == 'scissor'){
      //Player Two wins
      $('#game-results').text('Player Two Wins!')
      winner = snap.val().playerTwo.id
      player = 'playerTwo'
    } else if (playerOneChoice === 'scissor' && playerTwoChoice == 'rock'){
      //Player Two wins
      $('#game-results').text('Player Two Wins!')
      winner = snap.val().playerTwo.id
      player = 'playerTwo'
    } else if (playerOneChoice === 'scissor' && playerTwoChoice == 'paper'){
      //Player One wins
      $('#game-results').text('Player One Wins!')
      winner = snap.val().playerOne.id
      player = 'playerOne'
    }
    setTimeout(() => resetGame(winner, player), 5000)
  }
  if(snap.val().playerOne.id !== ''){
    $('#player-one-input').css('display', 'none')
    $('#player-one-btn').css('display', 'none')
    $('#player-one-wins').css('display', 'inline-block')
  }
  if(snap.val().playerTwo.id !== ''){
    $('#player-two-input').css('display', 'none')
    $('#player-two-btn').css('display', 'none')
    $('#player-two-wins').css('display', 'inline-block')
  }
  if(snap.val().playerOne.id === '' || snap.val().playerTwo.id === ''){
      $('#game-results').text('Waiting for players...')
      database.ref().once('value', (snap)=>{
        if(snap.val().paused){
          database.ref().update({paused: false})
        }
      })
  }
})
// When the connection list changes (users connect or disconnect, or name/wins changing)
connectionsList.on('value', (snap)=>{
  database.ref().once('value').then((snap2)=>{
    var isPlayerOne = snap2.val().GameState.playerOne.id
    var isPlayerTwo = snap2.val().GameState.playerTwo.id
    if(!snap.val()[isPlayerOne]){
      database.ref('/GameState').update({
        playerOne: {
          id: "",
          name: "",
          wins: 0,
        },
        pOneChoice: ""
      })
      $('#player-one-input').css('display', 'inline-block')
      $('#player-one-btn').css('display', 'inline-block')
      $('#player-one-wins').css('display', 'none')
    }
    if(!snap.val()[isPlayerTwo]){
      database.ref('/GameState').update({
        playerTwo: {
          id: "",
          name: "",
          wins: 0,
        },
        pTwoChoice: ""
      })
      $('#player-two-input').css('display', 'inline-block')
      $('#player-two-btn').css('display', 'inline-block')
      $('#player-two-wins').css('display', 'none')
    }
  })
  $('#watchers').text(`Viewers: ${snap.numChildren()}`)

  //
})
// Updated messages into the chat box when a new message arrives
chatRef.on('value', function(snap){
  var maxMessages = 15
  if(snap.numChildren() > maxMessages){
    var childCount = 0
    var updates = {}
    snap.forEach(function(child){
      if(++childCount < snap.numChildren() - maxMessages){
        updates[child.key] = null;
      }
    })
    chatRef.update(updates)
  }
})
chatRef.endAt().limitToLast(1).on('child_added', function(snap){
  $('#message-box').append(`
    <p>${snap.val().username.charAt(0).toUpperCase() + snap.val().username.slice(1)}: ${snap.val().message}</p>
    `)
  // Keep message box scrolled to the bottom
  // checking height of message box always returns static value, using static num until better solution found...
  $('#message-box').scrollTop(10000)
})

// Available to be clicked to set a user to player one.
$('#player-one-btn').on('click', function(){
  database.ref().once('value').then((snap)=>{
     if(snap.val().GameState.playerOne.id === '' && snap.val().GameState.playerTwo.id !== connectID){
       database.ref('/GameState/playerOne').update({
           id: connectID,
           name: snap.val().connections[connectID].name
       })
       $('#player-one-options').html(`
         <button id='player-one-rock' class='player-choice' data-choice='{"option": "rock", "player": "one"}'>Rock</button>
         <button id='player-one-paper' class='player-choice' data-choice='{"option": "paper", "player": "one"}'>Paper</button>
         <button id='player-one-scissor' class='player-choice' data-choice='{"option": "scissor", "player": "one"}'>Scissor</button>
         `)
     }
  })
})
// Available to be clicked to set a user to player two.
$('#player-two-btn').on('click', function(){
  database.ref().once('value').then((snap)=>{
     if(snap.val().GameState.playerTwo.id === '' && snap.val().GameState.playerOne.id !== connectID){
       database.ref('/GameState/playerTwo').update({
           id: connectID,
           name: snap.val().connections[connectID].name
       })
       $('#player-two-options').html(`
         <button id='player-two-rock' class='player-choice' data-choice='{"option": "rock", "player": "two"}'>Rock</button>
         <button id='player-two-paper' class='player-choice' data-choice='{"option": "paper", "player": "two"}'>Paper</button>
         <button id='player-two-scissor' class='player-choice' data-choice='{"option": "scissor", "player": "two"}'>Scissor</button>
         `)
     }
  })
})

// Checking for clicks on the player options after they have selected to be a specific player.
$(document).on('click', '.player-choice', function(){
  database.ref().once('value', (snap)=>{
    if(!snap.val().paused){
      var player = $(this).data('choice').player
      var option = $(this).data('choice').option
      if(player === 'one'){
        database.ref('/GameState').update({
          pOneChoice: option
        })
      } else if(player === 'two'){
        database.ref('/GameState').update({
          pTwoChoice: option
        })
      }
    }
  })
})

$('#submit-name-change').on('click', function(){
  event.preventDefault()
  if($('#input-change-name').val() !== ''){
    database.ref(`/connections/${connectID}`).update({name: $('#input-change-name').val().trim()})
  } else {
    // add invalid username error
  }
})

$('#submit-message').on('click', function(){
  event.preventDefault()
  connectionsList.once('value', function(snap){
    chatRef.push({
      id: connectID,
      username: snap.val()[connectID].name,
      message: $('#input-message').val(),
    })
  })
  $('#input-message').val('')
})

// database.ref('/connections').update({
//   [connectID]: {
//     name: 'Test',
//     wins: 0,
//   }
// })
