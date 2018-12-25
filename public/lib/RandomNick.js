

function randName(){
  let nameList = [
    'Time','Past','Future','Dev',
    'Fly','Flying','Soar','Soaring','Power','Falling',
    'Fall','Jump','Cliff','Mountain','Rend','Red','Blue',
    'Green','Yellow','Gold','Demon','Demonic','Panda','Cat',
    'Kitty','Kitten','Zero','Memory','Trooper','XX','Bandit',
    'Fear','Light','Glow','Tread','Deep','Deeper','Deepest',
    'Mine','Your','Worst','Enemy','Hostile','Force','Video',
    'Game','Donkey','Mule','Colt','Cult','Cultist','Magnum',
    'Gun','Assault','Recon','Trap','Trapper','Redeem','Code',
    'Script','Writer','Near','Close','Open','Cube','Circle',
    'Geo','Genome','Germ','Spaz','Shot','Echo','Beta','Alpha',
    'Gamma','Omega','Seal','Squid','Money','Cash','Lord','King',
    'Duke','Rest','Fire','Flame','Morrow','Break','Breaker','Numb',
    'Ice','Cold','Rotten','Sick','Sickly','Janitor','Camel','Rooster',
    'Sand','Desert','Dessert','Hurdle','Racer','Eraser','Erase','Big',
    'Small','Short','Tall','Sith','Bounty','Hunter','Cracked','Broken',
    'Sad','Happy','Joy','Joyful','Crimson','Destiny','Deceit','Lies',
    'Lie','Honest','Destined','Bloxxer','Hawk','Eagle','Hawker','Walker',
    'Zombie','Sarge','Capt','Captain','Punch','One','Two','Uno','Slice',
    'Slash','Melt','Melted','Melting','Fell','Wolf','Hound',
    'Legacy','Sharp','Dead','Mew','Chuckle','Bubba','Bubble','Sandwich',
    'Smasher','Extreme','Multi','Universe','Ultimate','Death','Ready','Monkey',
    'Elevator','Wrench','Grease','Head','Theme','Grand','Cool','Kid','Boy',
    'Girl','Vortex','Paradox','Faggot','Mind','Smorc','Dog','Fork','Spoon',
    'Bender','Clumsy','Crispy','Funky','Funny','Murloc','Daddy','Black',
    'Sock','Bucket','Duck','Mike','Terrorist','Counter','Mouse','Dragon',
    'Drake','Midnight','Night','Day','Moron','Pidor','Redin','Ox','Bull',
    'Bad','Boiii','Little','Lil','Pump','Peep','Oxxy'
  ];
  let name = '';
	name = nameList[~~( Math.random() * nameList.length )];
	name += nameList[~~( Math.random() * nameList.length )];
	if ( Math.random() > 0.8 ) {
	name += nameList[~~( Math.random() * nameList.length )];
}
	return name;
};
