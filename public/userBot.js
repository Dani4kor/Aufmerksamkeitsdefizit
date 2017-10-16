'use strict';

const DEFENDER_PLAYER_ID = 1;

const FORWARD_PLAYER_ID = 0;
const SEMIFORWARD_PLAYER_ID = 2;

const MIDDLE_OF_FIELD_X = 354;
const DEFENDING_ZONE_X = 300;
const FIELD_END_X = 708;

const defenderPositionModel = {
  x: 125,
  y: 236
};

const { pow, sqrt, cos, acos, sin, round, abs } = Math;



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

function ForwardPlayerModel(data) {
  this.x = data.yourTeam.players[0].x;
  this.y = data.yourTeam.players[0].y;
}



// -----------------------------------------------------------------------
// -------------------------------- MOVEMENT -----------------------------
// -----------------------------------------------------------------------



function getPlayerMove(data) {
  const playerModel = new DefenderPlayerModel(data);
  const ballModel = new BallModel(data);

  switch (data.playerIndex) {
    case DEFENDER_PLAYER_ID:
      return getDefenderMovement(data);
    case SEMIFORWARD_PLAYER_ID:
      return getSemiForwardMovement(data);
    default:
      return getBallApproachMovement(data, ballModel, playerModel);
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

function getSemiForwardMovement(data){
  let direction, velocity;

  const playerModel = new DefenderPlayerModel(data);
  const forwardModel = new ForwardPlayerModel(data);
  const ballStats = new BallModel(data);

  const ballTarget = {
    x: ballStats.x,
    y: ballStats.y
  }

  const middleFiled = {
    x : 354,
    y : 236.5
  }

  const forwardRange2ball = getRangeTo(forwardModel,  ballTarget)
  const semiForwardRange2ball = getRangeTo(playerModel,  ballTarget)

  if (forwardModel.x >= 256) {
      const direction = degreeToPoint(playerModel, ballTarget);
      const velocity = data.settings.player.maxVelocity + data.settings.player.maxVelocityIncrement

      //console.log("MOVE TO BALLFORWARD")
      return { direction, velocity };
    }
  else {
    //console.log("PLAY SAVE")
    return getBallApproachMovement(data, ballStats, playerModel);
  }
}


function getDefenderMovement(data) {
  const playerModel = new DefenderPlayerModel(data);
  const ballModel = new BallModel(data);
  let direction, velocity;

  if (ballModel.x >= DEFENDING_ZONE_X) {
    // go to defensive point
    const defense = {
      x: 100,
      y: ballModel.y
    }

    const { direction } = moveToPoint(playerModel, defense);
    const velocity = 2.5;

    return { direction, velocity }
  }

  if (ballModel.x > playerModel.x) {
    return getDefaultMovement(data);
  }

  return getBallApproachMovement(data, ballModel, playerModel);
}

function getBallApproachMovement(data, ball, player) {
  const MIN_RADIUS = 40;
  const { velocity } = ball;
  const calculatedRadius = round(velocity * 10);
  let actualRadius;

  if (ball.x < player.x && calculatedRadius > MIN_RADIUS) {
    actualRadius = calculatedRadius;
  } else {
    actualRadius = MIN_RADIUS;
  }

  // console.log(
  //   `
  //     Player #${data.playerIndex} at x:${player.x} y:${player.y}
  //     Ball at x:${ball.x} y:${ball.y}
  //     actualRadius:${actualRadius}
  //     MIN_RADIUS:${MIN_RADIUS}
  //     is player in range: ${isInRangeOf(player, ball, round(MIN_RADIUS*1.5), 0)}
  //     ----
  //     positions delta x:${Math.abs(player.x-ball.x)}
  //     positions delta y:${Math.abs(player.y-ball.y)}
  //   `
  // )

  const pointOfDestination = {
    x: ball.x - actualRadius,
    y: ball.y
  };

  // (1): cooficients of line function between player and the ball
  const [aPlayerBall, bPlayerBall] = GeomUtils.getLinearFunctionCooficients(
    player, ball
  );

  // (2): coordinates of crossing between line "player-ball" and the radius around the ball
  const aLarge = ball.x - player.x;
  const bLarge = ball.y - player.y;
  const cLarge = sqrt(pow(aLarge, 2) + pow(bLarge, 2));
  const alphaInRadians = acos(aLarge/cLarge);

  const aSmall = actualRadius * cos(alphaInRadians);
  const bSmall = actualRadius * sin(alphaInRadians);
  let x,y;
  if (player.x > ball.x && player.y > ball.y) {
    // case #1
    x = ball.x + aSmall;
    y = ball.y + bSmall;
  } else if (player.x > ball.x && player.y < ball.y) {
    // case #2
    x = ball.x + bSmall;
    y = ball.y - aSmall;
  } else if (player.x < ball.x && player.y < ball.y) {
    // case #3
    x = ball.x - bSmall;
    y = ball.y - aSmall;
  } else if (player.x < ball.x && player.y > ball.y) {
    // case #4
    x = ball.x - aSmall;
    y = ball.y + bSmall;
  }
  const crossing = {x,y};

  // find cooficients of the line function that is perpendicular to function (1) and
  // crosses the dot from (2)
  const [aCrossPlayerBall, bCrossPlayerBall] = GeomUtils.getPerpendicularLinearFunctionCooficients(
    aPlayerBall, bPlayerBall, crossing
  );

  // find out the X coordinates of the point-to-move
  const pointToMove = {
    x: ball.x - actualRadius,
    y: GeomUtils.getYofLinearFunction(aCrossPlayerBall, bCrossPlayerBall, ball.x - actualRadius)
  }

  // If already near the point -- go straight to the ball

  // console.log(`Player #${data.playerIndex} distance to PTM: ${getRangeTo(player, pointToMove)}`);
  if (isInRangeOf(player, pointToMove, MIN_RADIUS, 5)) {
    // console.log(`Player #${data.playerIndex} is in range of default movement!`);
    return getDefaultMovement(data);
  } else {
    // or go to point if still far from it
    return {
      direction: Math.atan2(pointToMove.y - player.y, pointToMove.x - player.x),
      velocity: 999
    };
  }
}



// -----------------------------------------------------------------------
// -------------------------------- UTILS --------------------------------
// -----------------------------------------------------------------------



function slowDownToTarget(player, target) {
  const inRange = isInRangeOf.bind(null, player, target);
  let velocity = 0;

  if (inRange(4, 3)) {
    //console.log('Should perform silent turn')
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

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function isInRangeOf(player, target, range, delta) {
  const distance = getRangeTo(player, target);
  return distance < range + delta * 2;
}

function getRangeTo(player, target) {
  return sqrt(pow(target.x-player.x, 2) + pow(target.y-player.y, 2));
}

function degreeToPoint(player, target) {
  return (
    Math.atan2(target.y - player.y, target.x - player.x)
  )
}

function moveToPoint(player, target) {
  return {
    direction: Math.atan2(target.y - player.y, target.x - player.x),
    velocity: 999
  };
}


class GeomUtils {
  static getLinearFunctionBasedOnTwoDots(first, second) {
    const [a,b] = GeomUtils.gauss([ [first.x, 1, first.y], [second.x, 1, second.y] ]);
    return GeomUtils.getYofLinearFunction.bind(null, a, b);
  }

  static getLinearFunctionCooficients(firstDot, secondDot) {
    return GeomUtils.gauss(
      [ [firstDot.x, 1, firstDot.y], [secondDot.x, 1, secondDot.y] ]
    );
  }

  static getLinearFunctionPerpendicularInDot(a, b, dot) {
    const $a = -1 / a;
    const $b = dot.y - $a * dot.x;
    console.log(`Func is: y = ${$a}x + ${$b}`);
    return GeomUtils.getYofLinearFunction.bind(null, $a, $b);
  }

  static getPerpendicularLinearFunctionCooficients(a, b, dot) {
    const $a = -1 / a;
    const $b = dot.y - $a * dot.x;
    return [$a, $b];
  }

  static getYofLinearFunction(a, b, x) {
    return a*x + b;
  }

  static getXofLinearFunction(a, b, y) {
    // y = ax + b
    // x = (y-b)/a
    return (y-b) / a;
  }

  static getTextRepresentationOfLinearFunction(first, second) {
    const [a,b] = GeomUtils.gauss([ [first.x, 1, first.y], [second.x, 1, second.y] ]);
    return `y = ${a}x + ${b}`
  }

  static gauss(A) {
    var n = A.length;

    for (var i=0; i<n; i++) {
        // Search for maximum in this column
        var maxEl = Math.abs(A[i][i]);
        var maxRow = i;
        for(var k=i+1; k<n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for (var k=i; k<n+1; k++) {
            var tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }

        // Make all rows below this one 0 in current column
        for (k=i+1; k<n; k++) {
            var c = -A[k][i]/A[i][i];
            for(var j=i; j<n+1; j++) {
                if (i==j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
        }
    }

    // Solve equation Ax=b for an upper triangular matrix A
    var x= new Array(n);
    for (var i=n-1; i>-1; i--) {
        x[i] = A[i][n]/A[i][i];
        for (var k=i-1; k>-1; k--) {
            A[k][n] -= A[k][i] * x[i];
        }
    }
    return x;
  }
}



onmessage = (e) => postMessage(getPlayerMove(e.data));
