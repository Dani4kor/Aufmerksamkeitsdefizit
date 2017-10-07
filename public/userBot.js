const DEFENDER_PLAYER_ID = 1;
const DEFENDER_POSITION_X_MAX = 250;
const DEFENDER_POSITION_X_MIN = 150;
const DEFENDER_POSITION_X_MIN_STARTSTOP = 100;

function DefenderBallModel(data) {
  const ballStats = getBallStats(data.ball, data.settings);
  this.x = ballStats.x;
  this.y = ballStats.y;
  this.velocity = data.ball.velocity;
}

function DefenderPlayerModel(data) {
  this.x = data.yourTeam.players[data.playerIndex].x;
}

function getPlayerMove(data) {
  // TODO : IMPLEMENT THE BETTER STRATEGY FOR YOUR BOT
  console.log(data);
  const pIndex = data.playerIndex;
  var currentPlayer = data.yourTeam.players[data.playerIndex];
  var ball = data.ball;

  let direction, velocity;
  var ballStop = getBallStats(ball, data.settings);

  if (pIndex === DEFENDER_PLAYER_ID) {
    return getDefenderMovement(
      new DefenderPlayerModel(data), new DefenderBallModel(data)
    );
  } else {
    direction = Math.atan2(ballStop.y - currentPlayer.y, ballStop.x - currentPlayer.x - ball.settings.radius);
    velocity = currentPlayer.velocity + data.settings.player.maxVelocityIncrement;
  }

  return { direction, velocity };
}

function getBallStats(ball, gameSettings) {
  var stopTime = getStopTime(ball);
  var stopDistance = ball.velocity * stopTime
    - ball.settings.moveDeceleration * (stopTime + 1) * stopTime / 2;

  var x = ball.x + stopDistance * Math.cos(ball.direction);
  var y = Math.abs(ball.y + stopDistance * Math.sin(ball.direction));

  // check the reflection from field side
  if (y > gameSettings.field.height) y = 2 * gameSettings.field.height - y;

  return { stopTime, stopDistance, x, y };
}

function getStopTime(ball) {
  return ball.velocity / ball.settings.moveDeceleration;
}

function getDefenderMovement(playerModel, ballStats) {
    let direction, velocity;

    if (playerModel.x > DEFENDER_POSITION_X_MAX) {
        velocity = 3;
        direction = toRadian(180);
    } else if (playerModel.x < DEFENDER_POSITION_X_MIN) {
        velocity = 3;
        direction = toRadian(0);
    } else if (playerModel.x < DEFENDER_POSITION_X_MAX && playerModel.x > DEFENDER_POSITION_X_MIN_STARTSTOP) {
      velocity = 0;
      direction = toRadian(0);
    }

    return { direction, velocity };
}



function toRadian(degree) {
	return (degree * 3.14) / 180;
}

onmessage = (e) => postMessage(getPlayerMove(e.data));
