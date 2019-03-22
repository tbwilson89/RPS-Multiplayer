var database = firebase.database()
var provider = new firebase.auth.GoogleAuthProvider();

var connectedRef = database.ref('.info/connected')
var connectionsList = database.ref('/connections')

var chatRef = database.ref('/Chat')
var connectID = ''


// Function to reset game state after a round and add to winning players win count.
function resetGame(winner, player){
  database.ref('/GameState').update({
    pOneChoice: "",
    pTwoChoice: "",
  })
  database.ref().update({paused: false})
  if(connectID === winner){
    database.ref().once('value', (snap)=>{
      var newWins = snap.val().connections[connectID].wins
      newWins++
      database.ref(`connections/${connectID}`).update({wins: newWins})
      database.ref(`/GameState/${player}`).update({wins: newWins})
    })
  }
  $('#game-results').text('Choose your weapon!')
}
function createUserReference(){
  // When a users name or wins changes, update persistent log in data if available, also update username display on page.
  database.ref(`connections/${connectID}`).on('value', function(snapConnections){
    database.ref(`/Users/${snapConnections.val().username}`).once('value', function(snapUser){
      if(snapUser.val()){
        if(snapConnections.val().name !== snapUser.val().name){
          database.ref(`/Users/${snapConnections.val().username}`).update({name: snapConnections.val().name})
        }
        if(snapConnections.val().wins !== snapUser.val().wins){
          database.ref(`/Users/${snapConnections.val().username}`).update({wins: snapConnections.val().wins})
        }
      }
      $('#current-username-display').text(snapConnections.val().name)
    })
  })
}

// When a user connects to the database / website
connectedRef.on('value', (snap)=>{
  if(snap.val()){
    var con = connectionsList.push({
      name: 'Anonymous',
      wins: 0,
    })
    connectID = con.key

    createUserReference()
    con.onDisconnect().remove()
  }
})

// When any data in the gamestate changes
database.ref('/GameState').on('value', (snap)=>{
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
    $('#player-one-btn').css('display', 'none')
    $('#player-one-wins').css('display', 'inline-block')
  } else {
    $('#player-one-options').empty()
    $('#player-one-input').css('display', 'inline-block')
    $('#player-one-btn').css('display', 'inline-block')
    $('#player-one-wins').css('display', 'none')
  }
  if(snap.val().playerTwo.id !== ''){
    $('#player-two-btn').css('display', 'none')
    $('#player-two-wins').css('display', 'inline-block')
  } else {
    $('#player-two-options').empty()
    $('#player-two-input').css('display', 'inline-block')
    $('#player-two-btn').css('display', 'inline-block')
    $('#player-two-wins').css('display', 'none')
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
    }
  })
  //Remove users that have disconnected
  $('#chat-active-users').children().each(function(){
    if(!snap.val()[$(this).data('user').id]){
      $(this).remove()
    }
  })
  for(key in snap.val()){
    // Add new users
    if ($(`#${key}`).text() === ''){
      var displayUserDiv = $(`<div id=${key} class='card col-md-12' data-user='{"id": "${key}"}'>${snap.val()[key].name}</div>`)
      $('#chat-active-users').append(displayUserDiv)
      // Update usernames when they are changed
    } else if ($(`#${key}`).text() !== snap.val()[key].name){
      $(`#${key}`).text(snap.val()[key].name)
    }
  }
  $('#watchers').text(`Viewers: ${snap.numChildren()}`)
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
    <p><b>${snap.val().username.charAt(0).toUpperCase() + snap.val().username.slice(1)}:</b> ${snap.val().message}</p>
    `)
  // Keep message box scrolled to the bottom
  // checking height of message box always returns static value, using static num until better solution found...
  $('#message-box').scrollTop(10000)
})

// Enter a player into the game, either player 1 or 2 depending on which button is pressed. Display buttons for choices during play.
$('.player-join-btn').on('click', function(){
  var playerChoice = $(this).data('option')

  database.ref().once('value').then((snap)=>{
     if(snap.val().GameState[`player${playerChoice}`].id === '' && snap.val().GameState.playerOne.id !== connectID){
       database.ref(`/GameState/player${playerChoice}`).update({
           id: connectID,
           name: snap.val().connections[connectID].name,
           wins: snap.val().connections[connectID].wins,
       })
       $(`#player-${playerChoice.toLowerCase()}-options`).html(`
         <button class='player-choice btn btn-primary' data-choice='{"option": "rock", "player": "${playerChoice}"}'>Rock</button>
         <button class='player-choice btn btn-primary' data-choice='{"option": "paper", "player": "${playerChoice}"}'>Paper</button>
         <button class='player-choice btn btn-primary' data-choice='{"option": "scissor", "player": "${playerChoice}"}'>Scissor</button>
         <button class='player-choice btn btn-danger' data-choice='{"option": "quit", "player": "${playerChoice}"}'>Quit</button>
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
      if(option === 'quit'){
        if (player === 'One'){
          database.ref('GameState').update({pOneChoice: ""})
        } else {
          database.ref('GameState').update({pTwoChoice: ""})
        }
        database.ref(`/GameState/player${player}`).update({
          id: '',
          name: '',
          wins: 0,
        })
      } else {
        if(player === 'One'){
          database.ref('/GameState').update({
            pOneChoice: option
          })
        } else if(player === 'Two'){
          database.ref('/GameState').update({
            pTwoChoice: option
          })
        }
      }
    }
  })
})

$('#submit-name-change').on('click', function(){
  event.preventDefault()
  if($('#input-change-name').val() !== ''){
    var newName = $('#input-change-name').val().trim()
    database.ref(`/connections/${connectID}`).update({name: newName})
  } else {
    // add invalid username error
  }
  $('#input-change-name').val('')
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

//Testing Google Auth
$('#google-login-btn').on('click', function(){
  event.preventDefault()
  firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    var username = user.email.substring(0, user.email.indexOf('@'))

    database.ref('/Users').once('value', function(snap){
      if(snap.val()[username]){
        database.ref(`/connections/${connectID}`).update({
          username: username,
          name: snap.val()[username].name,
          wins: snap.val()[username].wins,
        })
      } else {
        database.ref('/Users').update({
          [username]: {
            name: username,
            wins: 0,
          }
        })
        database.ref(`/connections/${connectID}`).update({
          username: username,
          name: username,
          wins: 0,
        })
      }
    })
    // ...
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
})
