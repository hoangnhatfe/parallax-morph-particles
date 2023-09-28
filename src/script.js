import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import Stats from 'three/addons/libs/stats.module.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import LocomotiveScroll from 'locomotive-scroll';

THREE.ColorManagement.enabled = false

/**
 * Debug
 */
const gui = new dat.GUI()
const container = document.createElement( 'div' );
document.body.appendChild( container );
const stats = new Stats();
// container.appendChild( stats.dom );


const parameters = {
    galaxyCount: 1000,
    mainMeshfromColor: '#ff6030',
    mainMeshToColor: '#1b3984',
}

gui.add(parameters, 'galaxyCount').min(100).max(10000).step(100).onFinishChange(() => {
    const galaxyCount = parameters.galaxyCount
    const galaxyPositions = new Float32Array(galaxyCount * 3);
    for (let i = 0; i < galaxyCount; i++) {
        const i3 = i * 3
        galaxyPositions[i3] = (Math.random() - 0.5) * 10
        galaxyPositions[i3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionLength
        galaxyPositions[i3 + 2] = (Math.random() - 0.5) * 10
    }
    BufferGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3))
})
gui.addColor(parameters, 'mainMeshfromColor').onFinishChange(() => {
    colorInside.set(parameters.mainMeshfromColor)
})
gui.addColor(parameters, 'mainMeshToColor').onFinishChange(() => {
    colorOutside.set(parameters.mainMeshToColor)
})
gui.close()
gui.hide()

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Mesh
const objectsDistance = 4
const sectionLength = 3
const galaxyCount = parameters.galaxyCount
const galaxyPositions = new Float32Array(galaxyCount * 3);

for (let i = 0; i < galaxyCount; i++) {
    const i3 = i * 3
    galaxyPositions[i3] = (Math.random() - 0.5) * 10
    galaxyPositions[i3 + 1] = (Math.random() - 0.5) * 10
    galaxyPositions[i3 + 2] = (Math.random() - 0.5) * 10
}
const BufferGeometry = new THREE.BufferGeometry()
BufferGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3))

const galaxy = new THREE.Points(BufferGeometry, new THREE.PointsMaterial({
    color: '#fff',
    sizeAttenuation: true,
    size: 0.01
}));

scene.add(galaxy)

/**
 * Particles
 */
const particlesXPosition = [2, -2, 2]
const particlesCount = 5000
const particlesPositions = new Float32Array(particlesCount * 3)
let currentSection = 0
let triggerRandom = false
let newparticlesPositions
const colorInside = new THREE.Color(parameters.mainMeshfromColor)
const colorOutside = new THREE.Color(parameters.mainMeshToColor)
const updateParticles = () => {
    if (triggerRandom) {
        let update = new Float32Array(particlesCount * 3)
        for(let i = 0; i < particlesCount * 3; i++) {
            update[i] = (Math.random() - 0.5) * 10
        }
        newparticlesPositions.array = update
        newparticlesPositions.count = particlesCount
        return;
    }
    switch (currentSection) {
        case 0:
            const sphereGeometry = new THREE.SphereGeometry(1.2, 96, 48)
            const sphereGeometryPosition = sphereGeometry.attributes.position
            newparticlesPositions = sphereGeometryPosition
            break
        case 1:
            const boxGeometry = new THREE.BoxGeometry(2, 2, 2, 28, 28, 26)
            const boxGeometryPosition = boxGeometry.attributes.position
            newparticlesPositions = boxGeometryPosition
            break
        case 2:
            const torusGeometry = new THREE.TorusGeometry(1, .4, 48, 100)
            const torusGeometryPosition = torusGeometry.attributes.position
            newparticlesPositions = torusGeometryPosition
            break
    }
}


const updateParticlesPositions = () => {
    let newCount = newparticlesPositions.count
    let newPoints = newparticlesPositions.array
    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3
        const oldPositions = particlesGeometry.attributes.position.array

        const x = newPoints[i3] === undefined ? newPoints[i3 % newCount] : newPoints[i3]
        const y = newPoints[i3 + 1] === undefined ? newPoints[i3 % newCount + 1] : newPoints[i3 + 1]
        const z = newPoints[i3 + 2] === undefined ? newPoints[i3 % newCount + 2] : newPoints[i3 + 2]

        particlesGeometry.attributes.position.array[i3] += (x  - oldPositions[i3]) * 0.05
        particlesGeometry.attributes.position.array[i3 + 1] += (y - oldPositions[i3 + 1]) * 0.05
        particlesGeometry.attributes.position.array[i3 + 2] += (z - oldPositions[i3 + 2]) * 0.05

        // Set color and alpha to particles
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, (y + 1) / 2)
        particlesGeometry.attributes.color.array[i3] = mixedColor.r
        particlesGeometry.attributes.color.array[i3 + 1] = mixedColor.g
        particlesGeometry.attributes.color.array[i3 + 2] = mixedColor.b
    }
    particlesGeometry.attributes.position.needsUpdate = true
    particlesGeometry.attributes.color.needsUpdate = true
}

const particlesGeometry = new THREE.BufferGeometry()
for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3
    particlesPositions[i3] = (Math.random() - 0.5) * 5
    particlesPositions[i3 + 1] = (Math.random() - 0.5) * 5
    particlesPositions[i3 + 2] = (Math.random() - 0.5) * 5

    // Set color and alpha to particles
    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, (particlesPositions[i3 + 1] + 1) / 2)
}
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(particlesCount * 3), 3))
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3))
const particlesMaterial = new THREE.PointsMaterial({
    color: '#fff',
    sizeAttenuation: true,
    size: 0.05,
    vertexColors: true,
})
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
particles.position.x = particlesXPosition[currentSection]

scene.add(particles)
updateParticles()

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
const scroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: true
});

// scroll.on('call', (args) => {
//     console.log('call', args)
// })

const changeGeometry = (curr) => {
    currentSection = curr
    triggerRandom = false
    gsap.to(particles.position, {
        duration: 1.5,
        ease: 'power3.out',
        x: particlesXPosition[currentSection],
    })
    updateParticles()
}
scroll.on('scroll', (args) => {
    if(typeof args.currentElements['section1'] === 'object') {
        let progress = args.currentElements['section1'].progress;
        if (progress >= 0.7 && !triggerRandom) {
            triggerRandom = true
            updateParticles()
        }
        if (progress < 0.7 && triggerRandom) {
            changeGeometry(0)
        }
    }
    if(typeof args.currentElements['section2'] === 'object') {
        let progress = args.currentElements['section2'].progress;
        if (!triggerRandom && (progress > 0 || progress < 1)) {
            triggerRandom = true
            updateParticles()
        }
        if (triggerRandom && (0.4 < progress && progress < 0.7)) {
            changeGeometry(1)
        }
    }
    if(typeof args.currentElements['section3'] === 'object') {
        let progress = args.currentElements['section3'].progress;
        // console.log('progress3', progress)
        if (!triggerRandom && (progress > 0 || progress < 1)) {
            triggerRandom = true
            updateParticles()
        }
        if (triggerRandom && (progress > 0.3 && progress < 0.7)) {
            changeGeometry(2)
        }
    }
});


// let scrollY = window.scrollY
// let sectionHeight = sizes.height

// window.addEventListener('scroll', () => {
//     scrollY = window.scrollY
//     const triggerNewSection = Math.round(scrollY / sectionHeight)
//     const changeNewSection = Math.floor(scrollY / sectionHeight)
//     if (!triggerRandom && triggerNewSection !== currentSection) {
//         triggerRandom = true
//         updateParticles()
//         console.log('trigger: trigger value' , triggerNewSection,'current Section', currentSection)
//     }
//     if (triggerRandom && changeNewSection !== currentSection) {
//         currentSection = changeNewSection
//         triggerRandom = false
//         console.log('change' ,changeNewSection, currentSection, particlesXPosition)
//         gsap.to(particles.position, {
//             duration: 1.5,
//             ease: 'power3.out',
//             x: particlesXPosition[currentSection],
//         })
//         updateParticles()
//     }
// })

/*
* Post processing
* */

const renderScene = new RenderPass( scene, camera )
renderScene.renderToScreen
const bloomPass = new UnrealBloomPass( new THREE.Vector2(sizes), 1.8, 0.4, 0.5 )
bloomPass.threshold = 0
bloomPass.strength = 1
bloomPass.radius = 0

const filmPass = new FilmPass(
    .5,  // noise intensity
    1,   // scanline intensity
    2048,  // scanline count
    false, // grayscale
);
filmPass.renderToScreen = true;

const composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( bloomPass );
composer.addPass( filmPass );

/**
 * Cursor
 */

const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0
let delta = 0
let interval = 1 / 900

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Parallax
    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime

    // Animate camera
    
    // Animate meshes
    particles.rotation.y += deltaTime * 0.02
    particles.rotation.x += deltaTime * 0.02

    // Render
    newparticlesPositions && updateParticlesPositions()
    // stats.update()
    // composer.render()
    
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    delta += clock.getDelta()
    if (delta  > interval) {
        stats.update()
        composer.render()
        delta = delta % interval
    }
}

tick()