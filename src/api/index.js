import axios from 'axios'
function searchMusic(query){
  return axios.get(`/v1/restserver/ting?method=baidu.ting.search.catalogSug&query=${query}`)
  // return axios.get(`http://14ch.cn/v1/restserver/ting?method=baidu.ting.search.catalogSug&query=${query}`)
}
function getLRC(id){
  return axios.get(`/v1/restserver/ting?method=baidu.ting.song.lry&songid=${id}`)
  // return axios.get(`http://14ch.cn/v1/restserver/ting?method=baidu.ting.song.lry&songid=${id}`)
}
export {
  searchMusic,
  getLRC
};
