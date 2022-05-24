(function () {
  //store base url
  const BASE_URL = 'https://assignment0.com/hangman/webservice/';

  //user calls
  const getAllUsers = async function(){
    const url = `${BASE_URL}players`;

    try {
      let resp = await fetch(url); 
      let users = await resp.json();
      
      return users;  
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }  
  }

  const createUser = async function(username, password){
    let url = `${BASE_URL}players/player=${username}`;
    let body = JSON.stringify({password:password});

    const requestOptions = {
      method: 'POST',
      body: body
    }

    let result = 0;

    try {
      const res = await fetch(url, requestOptions);
      result = await res.json();
            
    } catch (err) {
      console.log("error: " + err);
    }finally{
      return result;
    }
  }

  //rankings calls
  const getRankingsByCategory = async function(category){
    const url = `${BASE_URL}rankings/category=${category}`;

    try {
      let resp = await fetch(url); 
      let rankings = await resp.json();

      return rankings;
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }
  }

  const getRankingsByPlayer = async function(name){
    const url = `${BASE_URL}rankings/player=${name}`;

    try {
      let resp = await fetch(url); 
      let rankings = await resp.json();

      return rankings;
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }
  }

  const getRankingByCategoryAndPlayer = async function(name, category){
    const url = `${BASE_URL}rankings/player=${name}&category=${category}`;

    try {
      let resp = await fetch(url); 
      let rankings = await resp.json();
      console.log(rankings)
      return rankings;
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }    
  }

  const updateRanking = async function(rankingObj, password){
    const url = `${BASE_URL}rankings/player=${rankingObj.playerName}&category=${rankingObj.categoryName}`;

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({score: rankingObj.score, password: password})
    }

    try {
      const req = await fetch(url, requestOptions);
      const res = await req.json();
      
      //return true/false
      return res;  
    } catch (err) {
      console.log("error: " + err);
    }
  }

  //categories calls
  const getAllCategories = async function(){
    const url = `${BASE_URL}categories`;

    try {
      let resp = await fetch(url); 
      let categories = await resp.json();
  
      return categories;
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }
  }

  //vocabularies calls
  const getVocabByCategory = async function(category){
    const url = `${BASE_URL}vocabularies/category=${category}`;

    try {
      let resp = await fetch(url); 
      let vocabularies = await resp.json();

      return vocabularies;
    } catch (error) {
      console.log(`An error occurred: ${error}`);
    }

  }

  // public methods
  window.apiCalls = {
    getVocabByCategory: getVocabByCategory, 
    getRankingsByCategory: getRankingsByCategory,
    getRankingsByPlayer: getRankingsByPlayer,
    getRankingByCategoryAndPlayer: getRankingByCategoryAndPlayer,
    updateRanking: updateRanking,
    getAllCategories: getAllCategories,
    getAllUsers:getAllUsers,
    createUser: createUser
  };

})();
