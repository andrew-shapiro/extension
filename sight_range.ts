namespace sight {

    const ALERT_RANGE_SPRITE_DATA_KEY = "ALERT_RANGE_SPRITE_DATA_KEY"
    const ALERT_RANGE_SPRITES_SCENE_DATA_KEY = "ALERT_RANGE_SPRITES_SCENE_DATA_KEY"

    export class SightRangeSprite extends Sprite {
        protected shaderSprite: Sprite
        protected target: Sprite
        protected range: number

        public constructor(target: Sprite, shaderSprite: Sprite, range: number) {
            super(img`.`)
            this.target = target
            this.range = range
            this.shaderSprite = shaderSprite
        }

        updatePosition() {
            this.shaderSprite.x = this.target.x
            this.shaderSprite.y = this.target.y
        }

        destroy(effect?: effects.ParticleEffect, duration?: number) {
            super.destroy()
            this.shaderSprite.destroy()
        }
    }

    export class CircularSightRangeSprite extends SightRangeSprite {

        public constructor(target: Sprite, shaderSprite: Sprite, range: number) {
            super(target, shaderSprite, range)
            game.currentScene().physicsEngine.addSprite(this)
            this.target.onDestroyed(() => {
                this.shaderSprite.destroy()
                this.destroy()
            })
        }
    }

    export class ConicalSightRangeSprite extends SightRangeSprite {

        private direction: number
        private sightRange: number

        public constructor(target: Sprite, shaderSprite: Sprite, range: number, direction: number, sightRange: number) {
            super(target, shaderSprite, range)

            this.direction = direction
            this.sightRange = sightRange
        }

        updateDirection(direction: number) {
            this.direction = direction
            this.shaderSprite.destroy()

            this.shaderSprite = createSectionShader(this.range, this.direction, this.sightRange)
        }
    }

    export function updateSightDirection(target: SightRangeSprite, sightDirection: number) {
        if (target instanceof ConicalSightRangeSprite) {
            let sightRangeSprite = target as ConicalSightRangeSprite
            sightRangeSprite.updateDirection(sightDirection)
        }
    }

    export function sightRangeSpriteOn(sprite: Sprite): SightRangeSprite {
        return sprites.readDataSprite(sprite, ALERT_RANGE_SPRITE_DATA_KEY) as SightRangeSprite
    }

    export function createSectorAlertRange(target: Sprite, range: number, sightDirection: number, sightRange: number): ConicalSightRangeSprite {
        let shaderSprite = createSectionShader(range, sightDirection, sightRange / 2)
        let result = new ConicalSightRangeSprite(target, shaderSprite, range, sightDirection, sightRange / 2)

        sprites.setDataSprite(target, ALERT_RANGE_SPRITE_DATA_KEY, result)

        registerSightRangeSprite(result)

        return result;
    }

    function registerSightRangeSprite(sightRangeSprite: SightRangeSprite) {
        let alertRangeSprites = game.currentScene().data[ALERT_RANGE_SPRITES_SCENE_DATA_KEY] as SightRangeSprite[]
        if (!alertRangeSprites) {
            game.currentScene().data[ALERT_RANGE_SPRITES_SCENE_DATA_KEY] = alertRangeSprites = [] as SightRangeSprite[]
            game.eventContext().registerFrameHandler(scene.UPDATE_PRIORITY + 10, () => {
                let alertRangeSprites = game.currentScene().data[ALERT_RANGE_SPRITES_SCENE_DATA_KEY] as SightRangeSprite[]
                for (let alertRangeSprite of alertRangeSprites) {
                    alertRangeSprite.updatePosition()
                }
            })
        }
        alertRangeSprites.push(sightRangeSprite)
    }

    export function createCirularAlertRange(target: Sprite, range: number): CircularSightRangeSprite {
        let shaderSprite = createCircularShaderSprite(range)
        let result = new CircularSightRangeSprite(target, shaderSprite, range)
        sprites.setDataSprite(target, ALERT_RANGE_SPRITE_DATA_KEY, result)

        registerSightRangeSprite(result)

        return result;
    }

    function createCircularShaderSprite(range: number) {
        let result = image.create(range * 2, range * 2)
        result.fillCircle(range, range, range, 2)
        return shader.createImageShaderSprite(result, shader.ShadeLevel.One)
    }

    function createSectionShader(range: number, sightDirection: number, sightRange: number): Sprite {
        let result = image.create(range * 2, range * 2)
        for (let degree = sightDirection - sightRange; degree <= sightDirection + sightRange; degree++) {
            let degreeIn360 = (degree + 360) % 360
            let x = range * Math.cos(degreeIn360 / 180 * Math.PI)
            let y = Math.sqrt(range * range - x * x)
            if (degreeIn360 <= 180) {
                y = -y
            }
            result.drawLine(range, range, range + x, range - y, 2)
        }
        return shader.createImageShaderSprite(result, shader.ShadeLevel.One)
    }
}
