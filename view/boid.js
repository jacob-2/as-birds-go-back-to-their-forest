// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

let startTime = Date.now();

class Boid {
  constructor(start, end) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = start;
		this.end = end;

		this.size = 1 - .15 + .3 * Math.random();
		if(this.size < .9) this.size * .7;
		this.flapSpeed = 1 - .2 + .4 * Math.random();

    // this.r = 9.2;
    this.r = 5.5;
    this.maxspeed = 2.5; // Maximum speed
		this.minspeed = 1.5;
    this.maxforce = 0.06; // Maximum steering force
    // this.maxforce = 0.05; // Maximum steering force
  }

  run(boids, shift) {
		if (window.phase <= 1)
			this.freeFly();
		else if (window.phase === 2)
			this.circleCenter();
		else if (window.phase === 3)
			this.disperse();

    this.flock(boids);
    this.update();
    // this.borders();
    this.show(shift);
  }

  applyForce(force) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
  }

	freeFly() {

		// this.applyForce(this.seek(createVector(window.innerWidth*.5, window.innerHeight*.5)).mult(.2));

		this.applyForce(this.seek(createVector(window.innerWidth*.25, window.innerHeight*.5)).mult(.2));
		this.applyForce(this.seek(createVector(window.innerWidth*.5, window.innerHeight*.3)).mult(-.03));
		this.applyForce(this.seek(createVector(window.innerWidth*.5, window.innerHeight*.7)).mult(-.03));
		this.applyForce(this.seek(createVector(window.innerWidth*.75, window.innerHeight*.5)).mult(.2));
	}

	circleCenter() {
		let cen = createVector(window.innerWidth/2, window.innerHeight/2);
		let pos = this.position;
		let tar;
		if      (pos.x < cen.x && pos.y < cen.y) // left-top
			tar = createVector(window.innerWidth*.75, window.innerHeight*.25);
		else if (pos.x > cen.x && pos.y < cen.y) // right-top
			tar = createVector(window.innerWidth*.75, window.innerHeight*.75);
		else if (pos.x > cen.x && pos.y > cen.y) // right-bottom
			tar = createVector(window.innerWidth*.25, window.innerHeight*.75);
		else if (pos.x < cen.x && pos.y > cen.y) // left-bottom
			tar = createVector(window.innerWidth*.25, window.innerHeight*.25);
		this.applyForce(this.seek(tar).mult(.4));
		this.applyForce(this.seek(cen).mult(.2));
	}

	disperse() {
		let cen = createVector(window.innerWidth/2, window.innerHeight/2);
		this.applyForce(this.seek(cen).mult(-.05));
	}

  // We accumulate a new acceleration each time based on three rules
  flock(boids) {
    let sep = this.separate(boids); // Separation
    let ali = this.align(boids); // Alignment
    let coh = this.cohere(boids); // Cohesion
    // Arbitrarily weight these forces
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    if(this.velocity.mag() < this.minspeed)
			this.velocity.setMag(this.minspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target) {
    let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
  }

  show(shift) {
		let r = this.r * this.size;

    // Draw a triangle rotated in the direction of velocity
    let angle = this.velocity.heading();
    fill(155);
    stroke(200);
		strokeWeight(r*.2);
		strokeJoin(ROUND);
    push();
    translate(this.position.x, this.position.y);
    rotate(angle);
    beginShape();
    vertex(r * .9, r * .2);
    vertex(r * .9, -r * .2);
    vertex(-r * 1.4, -r * .6);
    vertex(-r * 1.4, r * .6);
    endShape(CLOSE);
    pop();

		
    fill(155);
    stroke(175);
		strokeWeight(r*.5);
		strokeJoin(ROUND);
    push();
    translate(this.position.x, this.position.y);
    rotate(angle);
    beginShape();
    // vertex(r * .5, 0);
		// let flap = Math.random() + .6;
		let flap = Math.sin((startTime - new Date().getTime())/150 * this.flapSpeed + Math.PI*(.5-shift));
		if (this.hold && flap > .9)
			this.hold = Math.floor(Math.random() * 2);
		else if (!this.hold && flap > .9)
			this.hold = true;
		if (this.hold)
			flap = 1;
		flap = flap * 2.5;
		// let flap = Math.sin(Math.PI * (new Date().getMilliseconds()-500)/500 + Math.PI*(.5-shift)) * 1.95;
    vertex(-r * 0, -r * flap * .5);
    vertex(-r * 0, r * flap * .5);
    vertex(-r * .7, r * flap);
    vertex(-r * .55, r * flap * .5);
    vertex(-r * .55, -r * flap * .5);
    vertex(-r * .7, -r * flap);
    // vertex(-r * .7, -r * 1.6);
    // vertex(-r * .7, r * 1.6);
    endShape(CLOSE);
    pop();
  }

  // Wraparound
  borders() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
		// let desiredSeparation = 25;
    let desiredSeparation = 35;
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if (d > 0 && d < desiredSeparation) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boids[i].position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids) {
    let neighborDistance = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if (d > 0 && d < neighborDistance) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohere(boids) {
    let neighborDistance = 50;
    let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if (d > 0 && d < neighborDistance) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }
}
