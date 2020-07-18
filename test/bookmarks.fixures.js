const testArrayPackage =()=>{

  return[
    { 
      id: 1,
      title : 'Cool Math games',
      url_address : 'https://coolmathgames.com',
      rating :5,
      bookmark_description :'its a cool place with cool games '
    },
    {
      id: 2,
      title : 'PostgreSql Tutorial / info',
      url_address : 'https://www.tutorialspoint.com/postgresql/index.htm',
      rating :4,
      bookmark_description :'a good resource for PostgreSql info'
    },
    {
      id: 3,
      title : 'dungeon and dragons',
      url_address : 'https://dnd.wizards.com/',
      rating :3,
      bookmark_description :'home page for one of the best games EVER'
    },

    {
      id: 4,
      title : 'dailymotion',
      url_address : 'https://www.dailymotion.com/', 
      rating :1,
      bookmark_description :'youtube.... if you do not know what youtube is you must be new here '

    }
  ];
};
 
    



module.exports = {testArrayPackage};
