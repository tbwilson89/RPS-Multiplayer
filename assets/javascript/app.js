var database = firebase.database()
var connectionsList = database.ref('/connections')
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
var connectedRef = database.ref('.info/connected')
connectedRef.on('value', (snap)=>{
  if(snap.val()){
    var con = connectionsList.push(true)
    connectID = con.key
    con.onDisconnect().remove()
  }
})
// When ANY information changes in the database
database.ref().on('value', (snap)=>{

})

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
// When the connection list changes (users connect or disconnect)
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
})

// Available to be clicked to set a user to player one.
$('#player-one-btn').on('click', function(){
  database.ref().once('value').then((snap)=>{
     if(snap.val().GameState.playerOne.id === '' && snap.val().GameState.playerTwo.id !== connectID){
       database.ref('/GameState/playerOne').update({
           id: connectID,
           name: $('#player-one-input').val()
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
           name: $('#player-two-input').val()
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
