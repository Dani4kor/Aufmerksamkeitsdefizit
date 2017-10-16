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


function PlayerModel(data) {
  return data.yourTeam.players[data.playerIndex];
}


function ForwardPlayerModel(data) {
  this.x = data.yourTeam.players[0].x;
  this.y = data.yourTeam.players[0].y;
}



// -----------------------------------------------------------------------
// -------------------------------- MOVEMENT -----------------------------
// -----------------------------------------------------------------------



function getPlayerMove(data) {
  // console.log(data);

  switch (data.playerIndex) {
    case DEFENDER_PLAYER_ID:
      return getDefenderMovement(data);
    case SEMIFORWARD_PLAYER_ID:
      return getSemiForwardMovement(data);
    default:
      return getBallApproachMovement(data);
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

  const playerModel = new PlayerModel(data);
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
    return getBallApproachMovement(data);
  }
}


function getBallApproachMovement(data) {
  const CORRIDOR_WIDTH = 50;
  const { playerIndex } = data;
  const ballStop = getBallStats(data.ball, data.settings);
  const player = new PlayerModel(data);
  const loggable = false;

  loggable && console.log(
    `
    ************************
    Player #${playerIndex} at x:${player.x} y:${player.y}
    Ball at x:${ballStop.x}, y:${ballStop.y}
    CORRIDOR_WIDTH: ${CORRIDOR_WIDTH}`
  );

  if (player.x <= ballStop.x - CORRIDOR_WIDTH) {
    loggable && console.log(`far from corridor -- approaching to the ballStop`);
    return getDefaultMovement(data);
  }

  if (ballStop.x - CORRIDOR_WIDTH <= player.x && player.x <= ballStop.x) {
    const distanceToBall = sqrt(pow(ballStop.x - player.x, 2) + pow(ballStop.y - player.y, 2));
    const target = {
      x: ballStop.x - distanceToBall / 4,
      y: ballStop.y
    };

    loggable && console.log(`in corridor -- approaching to x:${target.x}, y:${target.y}`);
    return moveToPoint(player, target);
  }

  const target = {
    x: ballStop.x,
    y: (ballStop.y < player.y) ? (ballStop.y + CORRIDOR_WIDTH) : (ballStop.y - CORRIDOR_WIDTH)
  };

  loggable && console.log(`further then ball, moving to x:${target.x}, y:${target.y}`);
  return moveToPoint(player, target);
}


function getDefenderMovement(data) {
  const player = new PlayerModel(data);
  const ball = new BallModel(data);


  if (ball.x >= DEFENDING_ZONE_X) {
    const pointOfDefence = {
      x: 100,
      y: ball.y
    };

    const { direction } = moveToPoint(player, pointOfDefence);
    const velocity = 2.5;

    return { direction, velocity };
  }

  return getBallApproachMovement(data);
}



// -----------------------------------------------------------------------
// -------------------------------- UTILS --------------------------------
// -----------------------------------------------------------------------



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
  const direction = Math.atan2(target.y - player.y, target.x - player.x);
  return {
    direction,
    velocity: speedTurn(player.direction, direction) ? 999 : 2.5
  }
}

function speedTurn(actual, calculated) {
  return actual-1 < calculated && calculated < actual+1;
}



onmessage = (e) => postMessage(getPlayerMove(e.data));
