const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Game state
let gameState = {
    power: 100,
    water: 100,
    food: 100,
    morale: 100,
    paused: false,
    quests: [
        { id: 0, name: "Fix Power Generator", completed: false, reward: { power: 25 } },
        { id: 1, name: "Repair Water Filters", completed: false, reward: { water: 30 } },
        { id: 2, name: "Distribute Food Rations", completed: false, reward: { food: 20 } }
    ]
};

// Create scene
const scene = new BABYLON.Scene(engine);
scene.collisionsEnabled = true;
scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

// Camera (first-person)
const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 2, 0));
camera.attachControl(canvas, true);
camera.inertia = 0.7;
camera.angularSensibility = 1000;
camera.keysUp = [];
camera.keysDown = [];
camera.keysLeft = [];
camera.keysRight = [];
camera.checkCollisions = true;
camera.speed = 0.15;

// Lighting
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.8;

// Create bunker floor
const floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 100, height: 100 }, scene);
floor.material = new BABYLON.StandardMaterial("floorMat", scene);
floor.material.diffuse = new BABYLON.Color3(0.3, 0.3, 0.3);
floor.checkCollisions = true;

// Create bunker walls
const northWall = BABYLON.MeshBuilder.CreateBox("northWall", { width: 100, height: 20, depth: 2 }, scene);
northWall.position.z = -50;
northWall.position.y = 10;
northWall.material = new BABYLON.StandardMaterial("wallMat", scene);
northWall.material.diffuse = new BABYLON.Color3(0.2, 0.2, 0.2);
northWall.checkCollisions = true;

const southWall = BABYLON.MeshBuilder.CreateBox("southWall", { width: 100, height: 20, depth: 2 }, scene);
southWall.position.z = 50;
southWall.position.y = 10;
southWall.material = northWall.material;
southWall.checkCollisions = true;

const eastWall = BABYLON.MeshBuilder.CreateBox("eastWall", { width: 2, height: 20, depth: 100 }, scene);
eastWall.position.x = 50;
eastWall.position.y = 10;
eastWall.material = northWall.material;
eastWall.checkCollisions = true;

const westWall = BABYLON.MeshBuilder.CreateBox("westWall", { width: 2, height: 20, depth: 100 }, scene);
westWall.position.x = -50;
westWall.position.y = 10;
westWall.material = northWall.material;
westWall.checkCollisions = true;

// Input handling
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

// Movement
const moveDirection = new BABYLON.Vector3(0, 0, 0);

engine.runRenderLoop(() => {
    // Movement
    const moveSpeed = 0.15;
    moveDirection.x = 0;
    moveDirection.z = 0;
    
    if (keys['w']) moveDirection.z += moveSpeed;
    if (keys['s']) moveDirection.z -= moveSpeed;
    if (keys['a']) moveDirection.x -= moveSpeed;
    if (keys['d']) moveDirection.x += moveSpeed;
    
    const forward = BABYLON.Vector3.Forward();
    const right = BABYLON.Vector3.Right();
    forward.rotateByQuaternionToRef(camera.absoluteRotation, forward);
    right.rotateByQuaternionToRef(camera.absoluteRotation, right);
    
    forward.y = 0;
    right.y = 0;
    
    if (moveDirection.length() > 0) {
        const movement = forward.scale(moveDirection.z).add(right.scale(moveDirection.x));
        camera.position.addInPlace(movement);
    }
    
    // Jump
    if (keys[' ']) {
        keys[' '] = false;
        camera.position.y += 0.3;
    }
    
    // Complete quest with Q
    if (keys['q']) {
        keys['q'] = false;
        completeQuest();
    }
    
    // Pause with P
    if (keys['p']) {
        keys['p'] = false;
        gameState.paused = !gameState.paused;
    }
    
    // Degrade resources
    if (!gameState.paused) {
        gameState.power -= 0.002;
        gameState.water -= 0.0015;
        gameState.food -= 0.001;
        gameState.morale -= 0.0005;
        
        gameState.power = Math.max(0, Math.min(100, gameState.power));
        gameState.water = Math.max(0, Math.min(100, gameState.water));
        gameState.food = Math.max(0, Math.min(100, gameState.food));
        gameState.morale = Math.max(0, Math.min(100, gameState.morale));
    }
    
    // Update UI
    updateUI();
    
    scene.render();
});

function completeQuest() {
    for (let quest of gameState.quests) {
        if (!quest.completed) {
            quest.completed = true;
            for (let resource in quest.reward) {
                gameState[resource] = Math.min(100, gameState[resource] + quest.reward[resource]);
            }
            break;
        }
    }
}

function updateUI() {
    document.getElementById("power").textContent = Math.floor(gameState.power);
    document.getElementById("water").textContent = Math.floor(gameState.water);
    document.getElementById("food").textContent = Math.floor(gameState.food);
    document.getElementById("morale").textContent = Math.floor(gameState.morale);
    
    let questsHtml = "";
    for (let quest of gameState.quests) {
        if (!quest.completed) {
            questsHtml += `<div style="color: #ffff00;">• ${quest.name}</div>`;
        }
    }
    document.getElementById("quests").innerHTML = questsHtml;
}

window.addEventListener("resize", () => engine.resize());