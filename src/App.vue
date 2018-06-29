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
    left:50%;
    top: 50%;
    transform:translate(-50%,-50%);
  }
</style>
