<template>
  <div id="app">
    <player class="player"></player>
  </div>
</template>

<script>

import player from './components/Mplayer'
export default {
  name: 'App',
  components: {
    player
  }
}
</script>

<style>
#app {

}
  .player{
    position:absolute;
    left:0;
    top: 50%;
    transform:translate(0,-50%);
  }
</style>
