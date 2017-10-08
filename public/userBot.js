const DEFENDER_PLAYER_ID = 1;

const FORWARD_PLAYER_ID = 0;
const SEMIFORWARD_PLAYER_ID = 2;

const MIDDLE_OF_FIELD_X = 354;
const FIELD_END_X = 708;

const defenderPositionModel = {
  x: 125,
  y: 236
};



// ------------------------------------------------------------------------
// -------------------------------- MODELS --------------------------------
// ------------------------------------------------------------------------



function BallModel(data) {
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
    direction: Math.atan2(
      ballStop.y - currentPlayer.y, ballStop.x - currentPlayer.x - ball.settings.radius
    ),
    velocity: currentPlayer.velocity + data.settings.player.maxVelocityIncrement
  };
}

function getDefenderMovement(data) {
  const playerModel = new DefenderPlayerModel(data);
  const ballModel = new BallModel(data);

  let direction, velocity;

  if (ballModel.x >= MIDDLE_OF_FIELD_X) {

    const direction = degreeToPoint(playerModel, defenderPositionModel);
    const velocity = slowDownToTarget(playerModel, defenderPositionModel);

    // console.log(`
    //   Defeneder coordinates is x:${playerModel.x} y:${playerModel.y}
    //   Position should be x:${defenderPositionModel.x} y:${defenderPositionModel.y}
    //   Range to target is ${getRangeTo(playerModel, defenderPositionModel)}
    //   Direction is ${direction} and velocity is ${velocity}
    // `);

    return { direction, velocity }
  } else {
    // return getBallApproachMovement(ballModel, playerModel);
    return getDefaultMovement(data);
  }

  return { direction, velocity };
}



// -----------------------------------------------------------------------
// -------------------------------- UTILS --------------------------------
// -----------------------------------------------------------------------



function slowDownToTarget(player, target) {
  const inRange = isInRangeOf.bind(null, player, target);
  let velocity = 0;

  if (inRange(4, 3)) {
    // blank
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

function getBallApproachMovement(ballPosition, defenderActualPosition) {
  const MIN_RADIUS = 50;
  const { velocity } = ballPosition;
  const calculatedRadius = velocity * 7;
  const actualRadius = calculatedRadius > MIN_RADIUS ? calculatedRadius : MIN_RADIUS;

  const defenderRadiusPosition = {
    x: ballPosition.x - actualRadius,
    y: ballPosition.y
  };

  if (isInRangeOf(defenderActualPosition, ballPosition, actualRadius, 5)) {
    // start motion based on circle of actualRadius

    /*
    TODO:
      1) построить касательную к точке назначения игрока на окружности (y = actualRadius.y, x=target.x)
      2) построить касательную к положению игрока на радиусе
      3) начать движение к пересечениям касательных
    */
  }

  console.log(`
    Approach radius is ${actualRadius};
    Defender's radius position is x:${defenderRadiusPosition.x}, y:${defenderRadiusPosition.y}
    Defender's actual position is x:${defenderActualPosition.x}, y:${defenderActualPosition.y}
    Ball actual position is x:${ballPosition.x} y:${ballPosition.y}
  `);

  return {
    direction: degreeToPoint(defenderActualPosition, { x: defenderRadiusPosition, y: ballPosition.y }),
    velocity: slowDownToTarget(defenderActualPosition, { x: defenderRadiusPosition, y: ballPosition.y })
  }
}

function getStopTime(ball) {
  return ball.velocity / ball.settings.moveDeceleration;
}

function toRadian(degree) {
	return (degree * 3.14) / 180;
}

function isInRangeOf(player, target, range, delta) {
  const distance = getRangeTo(player, target);
  return distance < range + delta * 2;
}

function getRangeTo(player, target) {
  return Math.sqrt(
    Math.pow(player.x-target.x, 2) + Math.pow(player.y-target.y, 2)
  );
}

function degreeToPoint(player, target) {
  return (
    Math.atan2(target.y - player.y, target.x - player.x)
  )
}



onmessage = (e) => postMessage(getPlayerMove(e.data));



class GeometricUtils {
  static buildLineOnBasedOnTwoDots(first, second) {
    // TODO: TBD
  }
}
