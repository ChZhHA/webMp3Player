<!--作者：陈宗豪     -->
<!--日期：2018-6-29 -->
<!--任务：音乐播放器 -->
<template>
  <div class="mini-container">
    <div class="mini-cover" :style="`height:${heightOp}px;width:${widthOp}px`"></div>
    <div class="button round button-1" @click="loadFile" v-if="!loaded">
      <div class="button-file"></div>
    </div>
    <div class="button round button-1" @click="switchPlay" v-else="loaded">
      <transition name="fade">
        <div class="button-play" v-show="!playing"></div>
      </transition>
      <transition name="fade">
        <div class="button-pause" v-show="playing"></div>
      </transition>
    </div>
    <transition name="fade">
      <div class="button-mini round disabled back" v-show="functionVisible_0">
        <div></div>
      </div>
    </transition>
    <transition name="fade">
      <div class="button-mini round disabled front" v-show="functionVisible_1">
        <div></div>
      </div>
    </transition>
    <transition name="fade">
      <div class="button no-border button-2" @click="unloadFile" v-show="functionVisible_2">
        <div class="button-unload"></div>
      </div>
    </transition>
    <transition name="normalfade">
      <div class="voice-menu" v-show="menuVisible_0">
        <div class="menu"></div>
      </div>
    </transition>
    <transition name="fade">
      <div class="button no-border button-3"
           @click="mute"
           @mouseover="entered"
           @mouseout="leaved"
           v-show="functionVisible_3">
        <div class="button-voice"></div>
      </div>
    </transition>

  </div>
</template>

<script>
  export default {
    name: "player",
    data() {
      return {
        boxStatus: {
          default: {
            height: 40,
            width: 40
          },
          loaded: {
            height: 40,
            width: 400
          }
        },
        playing: false,
        loaded: false,
        functionVisible_0:false,
        functionVisible_1:false,
        functionVisible_2:false,
        functionVisible_3:false,
        menuVisible_0:false
      }
    },
    methods: {
      loadFile() {
        this.loaded = true;
        this.playing = true;
        setTimeout(() => {
          this.functionVisible_0 = true;
        }, 300);
        setTimeout(() => {
          this.functionVisible_1 = true;
        }, 500);
        setTimeout(() => {
          this.functionVisible_2 = true;
        }, 700);
        setTimeout(() => {
          this.functionVisible_3 = true;
        }, 900);


      },
      unloadFile() {
        this.playing = false;
        this.functionVisible_0=false;
        this.functionVisible_1=false;
        this.functionVisible_2=false;
        this.functionVisible_3=false;
        this.loaded = false;
      },
      switchPlay() {
        this.playing = !this.playing;
      },
      entered() {
        if(!this.menuVisible_0)
          this.menuVisible_0=true;
      },
      leaved() {
        if(this.menuVisible_0)
          this.menuVisible_0=false;
      },
      mute() {

      }
    },
    computed: {
      heightOp() {
        return this.loaded ? this.boxStatus.loaded.height : this.boxStatus.default.height;
      },
      widthOp() {
        return this.loaded ? this.boxStatus.loaded.width : this.boxStatus.default.width;
      }
    }
  }
</script>

<style scoped>
  .mini-container{
    width: 400px;
    height: 40px;
    border-radius: 20px;
    user-select: none;
  }
  .mini-cover {
    position: absolute;
    left:50%;
    transform:translateX(-50%);
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: #fcfcfc;
    box-shadow: 0px 0px 4px #bbb;
    transition: all 0.3s ease;
  }

  .button {
    width: 38px;
    height: 38px;
    box-shadow: 0 0 5px #bbb;
    background: rgba(255, 255, 255, 0.8);
    overflow: hidden;
    transition: all 0.3s;
  }

  .button:hover {
    background: #263550;
  }

  .button-mini {
    width: 28px;
    background: rgba(255, 255, 255, 0.8);
    height: 28px;
    box-shadow: inset 0 0 3px #ddd , 0 0 0 #eee;
    transition: all 0.3s;
  }

  .button-mini:hover {
    background: #263550;
    box-shadow: inset 0 0 0 #ddd, 0 0 3px #eee;
  }

  .round {
    border-radius: 50%;
  }

  .no-border {
    box-shadow: none;
    border-radius: 50%;
    background: transparent;
  }

  .back, .front {
    position: absolute;
    left: calc(50% - 14px);
    top: 6px;
  }

  .back {
    transform: translateX(-150%);
  }

  .front {
    transform: translateX(150%);
  }

  .back div{
    width: 0;
    height: 0;
    border:8px solid transparent;
    border-right:10px solid #eee;
    margin-top:6px;
  }

  .front div{
    width: 0;
    height: 0;
    border:8px solid transparent;
    border-left:10px solid #eee;
    margin-top:6px;
    margin-left:10px;
  }

  .button-file {
    opacity: 0.8;
    width: 14px;
    height: 14px;
    margin-left: 8px;
    margin-top: 8px;
    border: 4px solid #ddd;
    border-radius: 50%;
  }

  .button-unload {
    width: 0;
    height: 0;
    margin-top: 7px;
    margin-left: 8px;
    border: 10px solid transparent;
    border-bottom-color: #ddd;
  }

  .button-unload:before {
    content: '';
    display: block;
    position: relative;
    background: #ddd;
    width: 18px;
    height: 3px;
    left: -9px;
    top: -5px;
  }

  .button-play {
    border: 12px solid transparent;
    border-left: 18px solid #ddd;
    position: absolute;
    left: 12px;
    opacity: 0.8;
    top: 7px;
  }

  .button-pause {
    width: 5px;
    height: 20px;
    background: #ddd;
    opacity: 0.8;
    margin-top: 9px;
    margin-left: 11px;
  }

  .button-pause:before {
    content: '';
    display: block;
    width: 5px;
    height: 20px;
    position: relative;
    background: #ddd;
    left: 11px;
  }

  .button-voice {
    margin-left: 8px;
    margin-top: 6px;
    width: 0;
    height: 10px;
    border: 8px solid transparent;
    border-right: 10px solid #ddd;
  }

  .button-voice:before {
    content: '';
    display: block;
    width: 6px;
    height: 10px;
    background: #ddd;
    position: relative;
    left: -8px;
  }

  .button-1 {
    position: absolute;
    left: 50%;
    top: 1px;
    transform: translateX(-50%);
  }

  .button-2 {
    position: absolute;
    left: 1px;
    top: 1px;
  }

  .button-3 {
    position: absolute;
    right: 1px;
    top: 1px;
  }

  .voice-menu{
    position: absolute;
    right:-25px;
    top:-25px;
    overflow: hidden;
    width:50px;

  }
  .voice-menu .menu{
    position: relative;
    left:-40px;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    border:20px solid #eee;
    border-left-color:transparent;
  }
  .fade-leave-active {
     transition: none;
   }

  .fade-enter-active {
    transition: all .5s;
  }

  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
  {
    opacity: 0;
    transform: scale(0.1);
  }

  .normalfade-enter-active,.normalfade-leave-active{
    transition:all .5s;
  }
  .normalfade-enter,.normalfade-leave-to{
    opacity: 0;
  }
</style>
