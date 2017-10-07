const DEFENDER_PLAYER_ID = 1;
const DEFENDER_POSITION_X = 250;
const DEFENDER_POSITION_Y = 236;

const MIDDLE_OF_FIELD_X = 354;
const FIELD_END_X = 708;



// ------------------------------------------------------------------------
// -------------------------------- MODELS --------------------------------
// ------------------------------------------------------------------------



function DefenderBallModel(data) {
  const ballStats = getBallStats(data.ball, data.settings);
  this.x = ballStats.x;
  this.y = ballStats.y;
  this.velocity = data.ball.velocity;
}

function DefenderPlayerModel(data) {
  this.x = data.yourTeam.players[data.playerIndex].x;
  this.y = data.yourTeam.players[data.playerIndex].y;
}



// -----------------------------------------------------------------------
// -------------------------------- UTILS --------------------------------
// -----------------------------------------------------------------------



function getPlayerMove(data) {
  // console.log(data);

  switch (data.playerIndex) {
    case DEFENDER_PLAYER_ID:
      return getDefenderMovement(data);
    default:
      return getDefaultMovement(data);
  }
}

function getDefaultMovement(data) {
  const currentPlayer = data.yourTeam.players[ data.playerIndex ];
  const ball = data.ball;
  const ballStop = getBallStats(ball, data.settings);

  return {
    direction: Math.atan2(ballStop.y - currentPlayer.y, ballStop.x - currentPlayer.x - ball.settings.radius),
    velocity: currentPlayer.velocity + data.settings.player.maxVelocityIncrement
  };
}

function getDefenderMovement(data) {
  const playerModel = new DefenderPlayerModel(data);
  const ballStats = new DefenderBallModel(data);

  let direction, velocity;

  if (ballStats.x >= MIDDLE_OF_FIELD_X) {
    // go to defencive point

    const targetModel = {
      x: DEFENDER_POSITION_X,
      y: DEFENDER_POSITION_Y
    };
    const direction = degreeToPoint(playerModel, targetModel);
    const velocity = slowDownToTarget(playerModel, targetModel);

    console.log(`
      Defeneder coordinates is x:${playerModel.x} y:${playerModel.y}
      Position should be x:${DEFENDER_POSITION_X} y:${DEFENDER_POSITION_Y}
      Range to target is ${getRangeTo(playerModel, targetModel)}
      Direction is ${direction} and velocity is ${velocity}
    `);

    return {
      direction,
      velocity
    }

  } else {
    return getDefaultMovement(data);
  }

  return { direction, velocity };
}



// -----------------------------------------------------------------------
// -------------------------------- UTILS --------------------------------
// -----------------------------------------------------------------------



function slowDownToTarget(player, target) {
  const inRange = isPlayerInRangeOf.bind(null, player, target);
  let velocity = 0;

  if (inRange(4, 3)) {
    console.log('Should perform silent turn')
  } else if (inRange(7.5, 0.625)) {
    velocity = 1;
  } else if (inRange(15, 1.25)) {
    velocity = 2;
  } else if (inRange(30, 2.5)) {
    velocity = 3;
  } else if (inRange(60, 5)) {
    velocity = 4;
  } else if (inRange(100, 10)) {
    velocity = 5;
  } else {
    velocity = 6;
  }

  return velocity;
}

function getBallStats(ball, gameSettings) {
  const stopTime = getStopTime(ball);
  const stopDistance = ball.velocity * stopTime
    - ball.settings.moveDeceleration * (stopTime + 1) * stopTime / 2;

  const x = ball.x + stopDistance * Math.cos(ball.direction);
  let y = Math.abs(ball.y + stopDistance * Math.sin(ball.direction));

  // check the reflection from field side
  if (y > gameSettings.field.height) y = 2 * gameSettings.field.height - y;

  return { stopTime, stopDistance, x, y };
}

function getStopTime(ball) {
  return ball.velocity / ball.settings.moveDeceleration;
}

function toRadian(degree) {
	return (degree * 3.14) / 180;
}

function isPlayerInRangeOf(player, target, range, delta) {
  const distance = getRangeTo(player, target);
  return distance < range + delta * 2;
}

function getRangeTo(player, target) {
  return Math.sqrt( 
    Math.pow(player.x-target.x, 2) + Math.pow(player.y-target.y, 2) 
  );
}

function degreeToPoint(player, targetModel) {
  return (
    Math.atan2(targetModel.y - player.y, targetModel.x - player.x)
  )
}



onmessage = (e) => postMessage(getPlayerMove(e.data));
