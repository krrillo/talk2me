import * as Phaser from 'phaser';
import { GameSpec } from './types';

export interface GameConfig {
  spec: GameSpec;
  onComplete: (result: { correct: boolean; score: number }) => void;
}

export class BaseGameScene extends Phaser.Scene {
  protected gameSpec: GameSpec;
  protected onComplete: (result: { correct: boolean; score: number }) => void;

  constructor(config: { key: string }) {
    super(config);
    this.gameSpec = {} as GameSpec;
    this.onComplete = () => {};
  }

  init(data: GameConfig) {
    this.gameSpec = data.spec;
    this.onComplete = data.onComplete;
  }

  protected playSuccessSound() {
    // Play success sound effect
    if (this.sound) {
      this.sound.play('success', { volume: 0.5 });
    }
  }

  protected playErrorSound() {
    // Play error sound effect
    if (this.sound) {
      this.sound.play('error', { volume: 0.3 });
    }
  }

  protected createBackground() {
    // Create a gradient background
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x98FB98, 0x87CEEB, 0x98FB98);
    bg.fillRect(0, 0, width, height);
    return bg;
  }

  protected createParticleEffect(x: number, y: number, color: number = 0xFFD700) {
    // Create particle effects for success
    const particles = this.add.particles(x, y, 'star', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      tint: color,
    });

    // Clean up after animation
    this.time.delayedCall(600, () => {
      particles.destroy();
    });

    return particles;
  }

  protected showFeedback(message: string, isSuccess: boolean) {
    const { width, height } = this.scale;
    
    // Create feedback popup
    const popup = this.add.container(width / 2, height / 2);
    
    const bg = this.add.graphics();
    bg.fillStyle(isSuccess ? 0x4CAF50 : 0xF44336);
    bg.fillRoundedRect(-150, -50, 300, 100, 20);
    
    const text = this.add.text(0, 0, message, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Comic Neue',
      align: 'center',
    }).setOrigin(0.5);
    
    popup.add([bg, text]);
    
    // Animate popup
    popup.setScale(0);
    this.tweens.add({
      targets: popup,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: popup,
            scale: 0,
            duration: 200,
            onComplete: () => popup.destroy()
          });
        });
      }
    });
  }
}

// Game Engine utility functions
export class GameEngine {
  static createPhaserConfig(containerId: string): Phaser.Types.Core.GameConfig {
    return {
      type: Phaser.AUTO,
      parent: containerId,
      width: 800,
      height: 600,
      backgroundColor: 0x87CEEB,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
      }
    };
  }

  static preloadCommonAssets(scene: Phaser.Scene) {
    // Load common assets that all games can use
    scene.load.audio('success', '/sounds/success.mp3');
    scene.load.audio('error', '/sounds/hit.mp3');
    
    // Create simple colored rectangles for drag items, buttons, etc.
    scene.load.image('button-bg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }
}
