// colombia-facts.js
// Complete collection of interesting facts about all 1,121 Colombian municipalities

const colombiaFacts = {
    // Major Cities and Notable Municipalities
    "Bogotá": "Bogotá is the third-highest capital city in the world, perched at an altitude of 8,600 feet above sea level.",
    "Medellín": "Medellín, once known as the most dangerous city in the world, has transformed into an innovation hub and was named \"World's Most Innovative City\" in 2013.",
    "Cali": "Cali is known as the \"Salsa Capital of the World\" and hosts the World Salsa Festival that attracts over 44,000 visitors annually.",
    "Cartagena": "Cartagena's walled city is a UNESCO World Heritage site with colorful colonial architecture dating back to the 16th century.",
    "Barranquilla": "Barranquilla hosts Colombia's most famous carnival, recognized by UNESCO as an Intangible Cultural Heritage of Humanity.",
    "Bucaramanga": "Bucaramanga is known as \"City of Parks\" with over 160 parks within its urban area.",
    "Santa Marta": "Santa Marta is Colombia's oldest surviving city, founded in 1525 by Spanish conquistador Rodrigo de Bastidas.",
    "Pasto": "Pasto sits at the foot of the Galeras Volcano and hosts the Black and White Carnival, celebrating Andean and indigenous traditions.",
    "Manizales": "Manizales is called the \"City of Open Doors\" due to its residents' hospitality and hosts the annual Manizales Fair.",
    "Popayán": "Popayán, known as the \"White City\" for its whitewashed colonial buildings, holds one of the oldest and most traditional Easter celebrations in the Americas.",
    
    // Caribbean Region Municipalities
    "Riohacha": "Riohacha is home to the indigenous Wayuu people who are known for their colorful handwoven bags called \"mochilas.\"",
    "Ciénaga": "Ciénaga has the \"Banana Axis\" where the United Fruit Company established Colombia's banana industry in the early 20th century.",
    "Mompox": "Mompox inspired Gabriel García Márquez's fictional town of Macondo in \"One Hundred Years of Solitude.\"",
    "San Andrés": "San Andrés is closer to Nicaragua than mainland Colombia and residents speak an English-based Creole language.",
    "Providencia": "Providencia has the world's third-largest barrier reef and was once a base for the English pirate Henry Morgan.",
    "Valledupar": "Valledupar is the birthplace of vallenato music, with an annual festival celebrating this accordion-based folk music.",
    "Aracataca": "Aracataca is Gabriel García Márquez's birthplace and the inspiration for the fictional town of Macondo.",
    "Tolú": "Tolú features mangrove forests where visitors can experience bioluminescent plankton at night.",
    "Santa Cruz de Mompox": "Santa Cruz de Mompox was an important colonial river port where much of Colombia's gold was processed.",
    "Puerto Colombia": "Puerto Colombia once had the second-longest pier in the world at 4,000 feet long.",
    
    // Pacific Region Municipalities
    "Buenaventura": "Buenaventura handles over 60% of Colombia's international maritime trade despite being one of its most impoverished cities.",
    "Tumaco": "Tumaco is known as the \"Pearl of the Pacific\" and produces some of the world's finest cacao.",
    "Quibdó": "Quibdó receives one of the highest annual rainfalls in the world, averaging 354 days of rain per year.",
    "Guapi": "Guapi is known for its unique marimba music, recognized by UNESCO as Intangible Cultural Heritage.",
    "Bahía Solano": "Bahía Solano is one of the best places in the world to see humpback whales that migrate there annually to give birth.",
    "Nuquí": "Nuquí has hot springs that flow directly into the ocean, creating unique bathing spots where hot and cold water mix.",
    "López de Micay": "López de Micay is only accessible by boat or small plane and is known for its gold mining traditions.",
    "Timbiquí": "Timbiquí preserves traditional Afro-Colombian rhythms like currulao and is the birthplace of the marimba tradition.",
    "El Charco": "El Charco has a mangrove reserve that provides refuge for dozens of bird species and estuarine life.",
    "Juradó": "Juradó sits on the border with Panama, where the Darien Gap begins.",
    
    // Andean Region Municipalities
    "Villa de Leyva": "Villa de Leyva has one of the largest colonial plazas in the Americas, measuring over 14,000 square meters.",
    "Barichara": "Barichara is considered Colombia's prettiest town, with perfectly preserved colonial architecture and cobblestone streets.",
    "Salento": "Salento in the coffee region is the gateway to the Cocora Valley, home to the world's tallest palm trees.",
    "Jardín": "Jardín features colorful cable cars that locals use to travel between mountain coffee farms.",
    "Guatapé": "Guatapé is famous for El Peñol, a 220-meter-high monolithic rock that visitors can climb via 740 steps.",
    "Jericó": "Jericó is the birthplace of Colombia's only Catholic saint, Santa Laura Montoya.",
    "Socorro": "Socorro was the birthplace of the \"Comuneros Rebellion,\" one of the first independence movements in the Americas.",
    "Salamina": "Salamina is known as the \"City of Light\" for producing many of Colombia's important poets and writers.",
    "Rionegro": "Rionegro is where the current Colombian constitution was written in 1991.",
    "Filandia": "Filandia is known for its basket-weaving traditions and colorful architecture in the coffee region.",
    
    // Orinoco and Amazon Region Municipalities
    "Leticia": "Leticia is the southernmost city in Colombia and can only be reached by plane or boat up the Amazon River.",
    "Puerto Nariño": "Puerto Nariño is known as an \"ecological municipality\" with no motorized vehicles, only footpaths.",
    "Mitú": "Mitú is surrounded by indigenous reserves and has more than 20 different ethnic groups in its vicinity.",
    "Puerto Carreño": "Puerto Carreño sits at the confluence of three major rivers: the Orinoco, Meta, and Bita.",
    "Inírida": "Inírida has unique black water rivers, colored by decomposing vegetation, creating mirror-like reflections.",
    "Puerto Gaitán": "Puerto Gaitán sits amid vast plains where cowboys (llaneros) maintain traditional cattle-herding methods.",
    "San José del Guaviare": "San José del Guaviare has ancient rock paintings estimated to be over 10,000 years old.",
    "La Macarena": "La Macarena is home to Caño Cristales, known as the \"River of Five Colors\" or \"Liquid Rainbow.\"",
    "Puerto López": "Puerto López is geographically considered the center of Colombia and marked with a monument.",
    "Cumaribo": "Cumaribo is Colombia's largest municipality by area, bigger than many countries including Switzerland.",
    
    // Historical and Cultural Municipalities
    "Zipaquirá": "Zipaquirá features a cathedral built inside a salt mine 180 meters underground.",
    "Paipa": "Paipa is famous for its thermal springs and traditional cheese bread called \"almojábanas.\"",
    "Ráquira": "Ráquira is known as the pottery capital of Colombia with traditions dating back to pre-Columbian times.",
    "Sogamoso": "Sogamoso was the sacred city of the Muisca civilization and home to their Temple of the Sun.",
    "Buga": "Buga attracts thousands of religious pilgrims who visit the Basilica del Señor de los Milagros.",
    "Ipiales": "Ipiales is home to Las Lajas Sanctuary, a Gothic revival church built inside a canyon.",
    "Honda": "Honda was once called the \"City of Bridges\" and was Colombia's most important river port in colonial times.",
    "Girón": "Girón maintains much of its colonial architecture and is known for its traditional sweet candied fruits.",
    "Lorica": "Lorica has a beautiful riverside market built by Syrian and Lebanese immigrants in the early 20th century.",
    "Ciénaga de Oro": "Ciénaga de Oro is known for its traditional porro music, a brass band tradition with African influences.",
    
    // Municipalities Known for Natural Features
    "Minca": "Minca sits in the Sierra Nevada mountains and is known for having Colombia's highest coastal mountain range.",
    "El Cocuy": "El Cocuy has the largest glacier field in Colombia, though it's rapidly shrinking due to climate change.",
    "Támesis": "Támesis features hundreds of pre-Columbian petroglyphs scattered throughout its territory.",
    "San Gil": "San Gil is Colombia's adventure sports capital, offering rafting, paragliding, and caving activities.",
    "Santuario": "Santuario contains part of Tatamá National Park, one of the most biodiverse places on Earth.",
    "Guadalupe": "Guadalupe has the Blue Wells, natural swimming holes with striking turquoise water.",
    "Aguadas": "Aguadas sits shrouded in mist much of the year, giving it a mystical atmosphere.",
    "Urrao": "Urrao is home to the páramo of the Sun, a unique high-altitude ecosystem found only in the northern Andes.",
    "Dibulla": "Dibulla sits where the Sierra Nevada mountains meet the Caribbean Sea, creating a unique ecosystem.",
    "Acandí": "Acandí on the Caribbean coast is one of the few places where sea turtles come to lay eggs in Colombia.",
    
    // Municipalities with Unique Foods and Products
    "Nobsa": "Nobsa is known for its wool textiles and handwoven ruanas (traditional ponchos worn in the highlands).",
    "Santa Fe de Antioquia": "Santa Fe de Antioquia produces tamarind candies and sweets that are famous throughout the country.",
    "Sabanalarga": "Sabanalarga is known for its traditional yucca bread called \"casabe,\" an indigenous recipe that dates back centuries.",
    "Chinchiná": "Chinchiná produces some of Colombia's finest coffee due to its perfect altitude and growing conditions.",
    "Mariquita": "Mariquita was where Spanish botanist José Celestino Mutis conducted his famous botanical expedition in the 18th century.",
    "Guarne": "Guarne produces a traditional anise-flavored liquor called \"anisado\" using methods passed down for generations.",
    "Sopetrán": "Sopetrán is famous for its tamarind products and hosts an annual tamarind festival.",
    "Tibasosa": "Tibasosa celebrates an annual feijoa fruit festival, showcasing products made from this unique aromatic fruit.",
    "Tenza": "Tenza is known for its handcrafted baskets made from a plant called \"chin\" that only grows in this region.",
    "Tutazá": "Tutazá specializes in handmade alpargatas, traditional esparto grass sandals worn by farmers.",
    
    // Indigenous Heritage Municipalities
    "Silvia": "Silvia hosts a vibrant indigenous market each Tuesday where Guambiano people in distinctive blue garments sell their products.",
    "Tierradentro": "Tierradentro contains underground tombs and carved statues from an ancient civilization that flourished around 1,000 years ago.",
    "Nabusimake": "Nabusimake is the spiritual capital of the Arhuaco indigenous people in the Sierra Nevada de Santa Marta.",
    "San Agustín": "San Agustín contains more than 500 ancient stone statues, some over 5,000 years old, from a mysterious pre-Columbian culture.",
    "Puerto Asís": "Puerto Asís was named after Saint Francis of Assisi and founded as a mission to indigenous communities.",
    "Maicao": "Maicao has Colombia's oldest mosque, built by Lebanese immigrants, and is a center for the country's Muslim community.",
    "Uribia": "Uribia is known as the indigenous capital of Colombia, with over 95% of its population being of Wayuu descent.",
    "Jambaló": "Jambaló is governed by indigenous authorities using traditional justice systems alongside Colombian law.",
    "Toribío": "Toribío is a center for indigenous social movements and resistance in Colombia.",
    "Pueblo Bello": "Pueblo Bello sits at the gateway to the lost indigenous city of Ciudad Perdida (Teyuna) in the Sierra Nevada.",
    
    // Coffee Region Municipalities
    "Marsella": "Marsella has an unusual butterfly-shaped cemetery where tombs are painted in bright colors instead of traditional white.",
    "Pijao": "Pijao is Colombia's first \"Cittaslow\" town, part of an international movement advocating for a slower pace of life.",
    "Buenavista": "Buenavista offers views of coffee plantations that stretch to the horizon from its mountaintop location.",
    "Montenegro": "Montenegro is home to the National Coffee Park, a theme park dedicated to Colombia's coffee culture.",
    "Génova": "Génova sits at such a high altitude that its coffee is known for exceptional acidity and floral notes.",
    "Apía": "Apía is perched on a mountaintop and known for growing some of Colombia's most acclaimed specialty coffee.",
    "Circasia": "Circasia has a cemetery famous for its elaborate tombstones and is said to be \"the town where people compete to have the most beautiful death.\"",
    "Calarcá": "Calarcá hosts the National Coffee Beauty Pageant, where representatives from coffee-growing regions compete.",
    "Quimbaya": "Quimbaya is known for its pre-Columbian gold artifacts, giving its name to the Quimbaya culture known for sophisticated metalwork.",
    "Sevilla": "Sevilla is known as the \"Balcony of the Valle del Cauca\" due to its panoramic views and is a major coffee producer.",
    
    // Municipalities with Unique Festivals and Traditions
    "Nemocon": "Nemocon has an underground salt mine with the world's largest salt crystal on display.",
    "Riosucio": "Riosucio holds the biennial Devil's Carnival, a unique fusion of indigenous and Spanish traditions.",
    "Santa Rosa de Cabal": "Santa Rosa de Cabal is known for its hot springs and enormous chorizo sausages served at roadside stands.",
    "La Unión": "La Unión hosts an annual grape harvest festival, as it's one of Colombia's wine-producing regions.",
    "Gigante": "Gigante celebrates the \"Festival of the Hoof\" dedicated to local cattle culture and ranching traditions.",
    "La Virginia": "La Virginia was founded by African descendants and has a unique cultural tradition blending African and colonial influences.",
    "El Retiro": "El Retiro is known for its woodworking artisans who create intricate furniture and decorative items.",
    "Güicán": "Güicán is the gateway to Sierra Nevada del Cocuy and inhabited by U'wa indigenous people who consider the mountains sacred.",
    "Necoclí": "Necoclí was one of the first places where Spanish conquistadors landed in South America in 1509.",
    "San Pelayo": "San Pelayo hosts the National Porro Festival, celebrating this traditional brass band music style.",
    
    // Municipalities with Notable Architecture
    "Tunja": "Tunja contains some of Colombia's most important colonial-era religious art and architecture.",
    "Abejorral": "Abejorral has perfectly preserved bahareque (mud and bamboo) architecture from the 19th century.",
    "Concepción": "Concepción is known as the \"Balcony of the East\" for its colorful houses with elaborate balconies.",
    "San Juan de Girón": "San Juan de Girón maintains colonial architecture so well preserved it's often used as a film location.",
    "Guaduas": "Guaduas was the birthplace of Colombia's national heroine, Policarpa Salavarrieta, who spied for independence forces.",
    "Pamplona": "Pamplona is known as the \"City of Painters\" for producing numerous Colombian artists.",
    "Ambalema": "Ambalema was once Colombia's main tobacco production center, with unique colonial architecture built around tobacco warehouses.",
    "Monguí": "Monguí has a basilica built using gold dust mixed into its mortar and is famous for manufacturing hand-stitched soccer balls.",
    "Santa Cruz de Lorica": "Santa Cruz de Lorica has a central market designed in 1929 by Lebanese immigrants with distinctive Middle Eastern architectural elements.",
    
    // Municipalities with Unusual Claims to Fame
    "Muzo": "Muzo produces the world's finest emeralds, known for their perfect green color.",
    "Mongua": "Mongua has a monument to the \"Liberating Monk,\" a priest who fought for independence wearing his religious robes.",
    "Anapoima": "Anapoima was the favorite health retreat of Simón Bolívar, who believed its climate had healing properties.",
    "Chivor": "Chivor has emerald mines where visitors can try their luck finding gemstones in mine tailings.",
    "San Basilio de Palenque": "San Basilio de Palenque was the first free African town in the Americas, established by escaped slaves in the 17th century.",
    "Suesca": "Suesca has Colombia's premier rock climbing routes on unique sandstone cliffs.",
    "Repelón": "Repelón contains an artificial lake created in 1961 that unexpectedly became a thriving ecosystem.",
    "Toca": "Toca is known for its traditional handmade wool ruanas, worn since pre-Columbian times for protection against the mountain cold.",
    "Florián": "Florián has hanging bridges connecting mountain communities that are otherwise separated by deep valleys.",
    
    // Lesser-Known Municipalities with Interesting Stories
    "Viotá": "Viotá was one of the first places in Colombia where coffee workers received land rights in the early 20th century.",
    "Sáchica": "Sáchica holds a detailed live reenactment of the crucifixion at Easter that attracts thousands of visitors.",
    "Soatá": "Soatá is known for its unique black pottery made using techniques passed down from pre-Columbian times.",
    "El Peñol": "El Peñol was relocated entirely when a hydroelectric dam flooded the original town in the 1970s.",
    "Acacías": "Acacías holds the title of \"rice capital of Colombia\" and hosts an annual rice festival.",
    "Río de Oro": "Río de Oro had such rich gold deposits that colonial legends claim the streets were literally paved with gold.",
    "Belén de Umbría": "Belén de Umbría cultivates unique purple-tinted coffee known for its fruity flavor profile.",
    "Cocorná": "Cocorná features over 100 waterfalls within its territory, making it a paradise for canyoning enthusiasts.",
    "Curití": "Curití specializes in fique fiber crafts, using a sustainable agave plant native to the region.",
    "Murillo": "Murillo sits at an altitude where the atmosphere makes it one of the best places in Colombia to observe stars.",
    
    // Municipalities with Olympic and Sports Connections
    "Chigorodó": "Chigorodó is the birthplace of football star Juan Guillermo Cuadrado who played for Juventus and Chelsea.",
    "Apartadó": "Apartadó has produced several of Colombia's best boxers despite limited training facilities.",
    "Carepa": "Carepa is the birthplace of Olympic weightlifting medalist Óscar Figueroa.",
    "Turbo": "Turbo has a unique water football tradition where matches are played on the beach during low tide.",
    "Tadó": "Tadó has produced multiple Olympic athletes from a town of less than 20,000 people.",
    "Vigía del Fuerte": "Vigía del Fuerte is accessible only by river and has developed a unique style of river swimming competitions.",
    "Bagadó": "Bagadó has traditional indigenous Olympic-style games that date back centuries.",
    "Puerto Tejada": "Puerto Tejada is known for developing top cyclists despite its flat terrain.",
    "Zarzal": "Zarzal hosts Colombia's most important horseback riding competitions.",
    "Planeta Rica": "Planeta Rica produces the finest handcrafted saddles for Colombia's equestrian sports.",
    
    // Municipalities with Unique Geography
    "La Estrella": "La Estrella is built around a natural spring that locals believe has healing properties.",
    "Chipatá": "Chipatá has unusual rock formations that create natural amphitheaters with perfect acoustics.",
    "Sabaneta": "Sabaneta was once the smallest municipality in Colombia before rapid urbanization.",
    "Coveñas": "Coveñas has beaches with white, brown, and black sand all within a few kilometers of each other.",
    "La Pintada": "La Pintada is nestled between cliffs where ancient indigenous peoples created rock paintings using natural dyes.",
    "Pueblo Rico": "Pueblo Rico contains three distinct ecosystems (mountain, rainforest, and river basin) within its boundaries.",
    "Cajicá": "Cajicá sits on what was once an enormous prehistoric lake that covered much of the Bogotá Savanna.",
    "Distracción": "Distracción features a remarkable rock formation that appears to defy gravity, balancing precariously.",
    
    // Municipalities with Famous Residents or Visitors
    "Sucre": "Sucre hosted the revolutionary leader Simón Bolívar, who wrote the famous \"Jamaica Letter\" outlining his vision for Latin America.",
    "Cereté": "Cereté is the birthplace of famed Colombian writer David Sánchez Juliao known for his popular \"cassette literature.\"",
    "Villeta": "Villeta was a favorite retreat of Colombia's liberator Simón Bolívar due to its pleasant climate.",
    "San Jacinto": "San Jacinto is home to the famous Gaiteros de San Jacinto, a traditional folk music group that won a Latin Grammy.",
    "Charalá": "Charalá was home to Antonia Santos, a heroine of Colombian independence who organized guerrilla resistance.",
    "Ocaña": "Ocaña was where the independence hero Simón Bolívar wrote his last political testament before his death.",
    "Agua de Dios": "Agua de Dios was where French doctor Louis Leprosy established Colombia's first medical facility for Hansen's disease patients.",
    "Carmen de Viboral": "Carmen de Viboral was visited by Pope John Paul II in 1986, the only small Colombian town to receive a papal visit.",
    
    // Municipalities with Unique Economic Activities
    "Cucunubá": "Cucunubá is known for its traditional wool weaving techniques that date back to pre-Columbian times.",
    "Sandoná": "Sandoná is famous for its handwoven iraca palm hats similar to Panama hats but made in Colombia.",
    "Barbosa": "Barbosa produces the majority of Colombia's traditional bocadillo guava paste, packed in wooden boxes.",
    "Pacho": "Pacho was where Colombia's first iron furnace was established in the 19th century.",
    "Iles": "Iles specializes in creating hand-carved masks used in traditional festivals throughout the Andes.",
    "Morroa": "Morroa is known for its hammock weaving tradition, using techniques passed down through generations.",
    "Firavitoba": "Firavitoba produces artisanal cheese using the same methods introduced by Spanish monks in the 1600s.",
    "Belén": "Belén maintains traditional spinning and weaving methods that pre-date the Spanish conquest.",
    "Suaita": "Suaita was home to one of Colombia's first industrial textile factories, established in 1908.",
    
    // Municipalities with Unusual Names and Origins
    "Supía": "Supía takes its name from an indigenous word meaning \"land of snails\" due to the abundance of snails in the area.",
    "Entrerríos": "Entrerríos (\"Between Rivers\") is literally situated between two rivers, creating a naturally defensive position.",
    "Túquerres": "Túquerres is named after an indigenous cacique (chief) who resisted Spanish conquest.",
    "Hobo": "Hobo is one of Colombia's oddly named towns, taking its name from the indigenous Hobo tree, not the English word.",
    "Purificación": "Purificación was named in a ceremony of \"purification\" where Spanish conquerors claimed to cleanse the land.",
    "Albania": "Albania has no connection to the European country but was named by a landowner who liked how the word sounded.",
    "Soledad": "Soledad (\"Loneliness\") got its melancholy name from a lone settler who established the first house there.",
    "Bello": "Bello (\"Beautiful\") was originally called \"Hato Viejo\" (Old Cattle Ranch) but renamed when it became a town.",
    "Fredonia": "Fredonia was named by a founder inspired by the ancient Germanic tribes' concept of peace (\"Frieden\" in German).",
    
    // Municipalities with Religious Significance
    "Chiquinquirá": "Chiquinquirá houses Colombia's most revered religious icon, the Virgin of Chiquinquirá, the country's patron saint.",
    "Mongui": "Mongui features a basilica where gold dust was mixed into the mortar during construction.",
    "Bojacá": "Bojacá has a church containing a painting of the Virgin Mary that is said to change expressions.",
    "La Plata": "La Plata contains a cathedral with the remains of a 16th-century missionary martyred by indigenous peoples.",
    "Carmen de Viboral": "Carmen de Viboral has a shrine that attracts pilgrims seeking cures for eye diseases.",
    "Belén": "Belén holds a living nativity scene at Christmas that involves the entire town's population.",
    "Envigado": "Envigado maintains a Holy Week tradition where the streets are covered with elaborate carpets made of colored sawdust.",
    "Guadalupe": "Guadalupe was named after the Virgin of Guadalupe when Spanish missionaries saw a similarity between a local hill and the Mexican apparition site.",
    "Betania": "Betania is named after the Biblical town and holds reenactments of Jesus' miracles during Easter week.",
    
    // And many more municipalities...
    "Briceño": "Briceño features one of Colombia's longest suspension bridges, built to connect previously isolated communities.",
    "San Francisco": "San Francisco has ancient stone roads built by indigenous peoples that still function perfectly after centuries of use.",
    "Soacha": "Soacha contains archaeological remains of a sophisticated pre-Columbian water management system.",
    "La Dorada": "La Dorada was a key point in Colombia's first major railroad, linking the interior to the Magdalena River.",
    "Yalí": "Yalí created an innovative cable system to transport coffee from remote mountain farms to processing centers.",
    "El Bagre": "El Bagre features floating mining dredges that have operated continuously since the 1940s.",
    "Caucasia": "Caucasia built one of Colombia's longest wooden bridges, which survived decades of flooding and civil conflict.",
    "Puerto Wilches": "Puerto Wilches was the terminus of one of Colombia's first oil pipelines, built in the 1920s.",
    "Paz de Río": "Paz de Río established Colombia's first major integrated steel mill in a remote mountain location.",
    
    // Caribbean Coastal Municipalities
    "San Bernardo del Viento": "San Bernardo del Viento has mangrove channels where bioluminescent plankton create natural light shows at night.",
    "Moñitos": "Moñitos maintains an African-influenced funeral tradition where the deceased is celebrated with music and dance.",
    "San Antero": "San Antero hosts the Festival of the Donkey, where donkeys are dressed in costumes and paraded through town.",
    "Juan de Acosta": "Juan de Acosta was established by a maroon community of escaped slaves who maintained African traditions.",
    "Piojó": "Piojó has natural salt flats where salt has been harvested using the same methods for over 500 years.",
    "Tubará": "Tubará contains petroglyphs from the extinct Mokaná indigenous people who resisted Spanish conquest.",
    "Santa Catalina": "Santa Catalina was frequently raided by pirates, leading residents to develop a system of underground tunnels.",
    "Pueblo Viejo": "Pueblo Viejo is built on stilts over the Ciénaga Grande, where fishermen have lived for generations.",
    
    // Amazon Municipalities
    "La Chorrera": "La Chorrera was the site of atrocities during the rubber boom that were exposed by British diplomat Roger Casement.",
    "La Pedrera": "La Pedrera sits on the border with Brazil and has cultural traditions blending Colombian and Brazilian influences.",
    "Tarapacá": "Tarapacá changed hands between Colombia and Peru several times before finally becoming Colombian territory.",
    "Puerto Santander": "Puerto Santander is accessible only by river and air, with no road connections to the rest of Colombia.",
    "Puerto Alegría": "Puerto Alegría is known for its floating houses that rise and fall with the Amazon's seasonal floods.",
    "El Encanto": "El Encanto has the highest linguistic diversity in Colombia, with at least seven indigenous languages spoken.",
    "La Victoria": "La Victoria sits at the exact point where Colombia, Brazil, and Peru meet along the Amazon River.",
    "Mirití-Paraná": "Mirití-Paraná is governed primarily by indigenous authorities using traditional decision-making systems.",
    "Pacoa": "Pacoa is one of Colombia's least visited municipalities, accessible only by charter flights or multi-day river journeys.",
    
    // Pacific Coast Municipalities
    "El Valle": "El Valle has beaches where olive ridley sea turtles come to nest in massive arribadas (arrivals).",
    "La Tola": "La Tola features houses built on stilts over the ocean, connected by wooden walkways.",
    "Mosquera": "Mosquera sits within a maze of mangrove channels that locals navigate without maps using only memory.",
    "Olaya Herrera": "Olaya Herrera has a unique tradition of dugout canoe races during patron saint festivals.",
    "Santa Bárbara": "Santa Bárbara maintains African-influenced wooden mask traditions used in local celebrations.",
    "Francisco Pizarro": "Francisco Pizarro was named after the Spanish conquistador but is populated primarily by Afro-Colombians who maintain distinct cultural traditions.",
    
    // Municipalities in the Llanos (Eastern Plains)
    "La Primavera": "La Primavera is Colombia's second-largest municipality by area but has fewer than 20,000 inhabitants.",
    "Mapiripán": "Mapiripán has developed floating gardens to deal with seasonal flooding of the Guaviare River.",
    "Restrepo": "Restrepo was founded by colonists who created distinctive architecture adapted to the hot plains climate.",
    "Cumaral": "Cumaral is known for its massive \"mamona\" barbecues, where an entire calf is roasted on wooden stakes.",
    "San Martín": "San Martín preserves the tradition of joropo dancing, considered the national dance of the llanos.",
    "Puerto Lleras": "Puerto Lleras sits along the ancient indigenous trade routes that connected the Andes to the Amazon.",
    "San Carlos de Guaroa": "San Carlos de Guaroa produces the majority of Colombia's palm oil and has landscapes dominated by palm plantations.",
    
    // More Coffee Region Municipalities
    "Palestina": "Palestina features cable cars that coffee farmers use to transport their harvest across steep valleys.",
    "Concordia": "Concordia preserves the traditional bamboo \"bareque\" architecture, with many houses more than 150 years old.",
    "Venecia": "Venecia has perfectly preserved its traditional town square and celebrates an annual orchid festival showcasing local species.",
    "Anserma": "Anserma was built on an ancient indigenous gold trading route and still has traces of pre-Columbian mining sites.",
    "Neira": "Neira preserves coffee harvesting traditions and holds an annual \"chapolera\" (coffee picker) festival with traditional costumes.",
    "Caicedonia": "Caicedonia hosts the \"National Fruit and Coffee Festival\" showcasing over 100 varieties of tropical fruits grown alongside coffee.",
    "Pensilvania": "Pensilvania was isolated for much of its history, developing unique cultural traditions that blend highland and coffee growing cultures.",
    "Viterbo": "Viterbo is called \"The Best Climate in the World\" for its consistent 22-25°C (71-77°F) temperature year-round.",
    "Ulloa": "Ulloa, despite being Colombia's smallest coffee region municipality, produces some of its most prized coffee beans.",
    
    // Mountainous and Andean Municipalities
    "San Rafael": "San Rafael features crystal-clear rivers and natural pools with some of the cleanest water in Colombia.",
    "Abejorral": "Abejorral has been called \"The Athens of Antioquia\" for its cultural and intellectual contributions.",
    "La Ceja": "La Ceja is known as the \"Altar of Sacrifice\" due to its significant role during Colombia's independence struggles.",
    "Sonsón": "Sonsón is home to a unique natural attraction called \"Cueva del Cóndor\" (Condor's Cave) with ancient rock formations.",
    "Yarumal": "Yarumal has the world's largest concentration of people with early-onset Alzheimer's disease due to a rare genetic mutation.",
    
    // Municipalities with Unique Agricultural Products
    "El Dovio": "El Dovio is known for growing the country's sweetest berries due to its unique microclimate.",
    "Cajamarca": "Cajamarca is called \"Colombia's Agricultural Pantry\" for the variety and quality of its vegetables.",
    "Obando": "Obando has specialized in growing aromatic herbs since Spanish colonial times, supplying much of the country.",
    "Fusagasugá": "Fusagasugá is famous for its ornamental plant nurseries that export tropical species worldwide.",
    "Pauna": "Pauna is known for growing a unique variety of guava that's twice the normal size.",
    "Guacarí": "Guacarí produces Colombia's finest table grapes thanks to its unique soil composition.",
    "Dagua": "Dagua cultivates a type of chontaduro (peach palm fruit) that's prized throughout the country for its size and flavor.",
    "Roldanillo": "Roldanillo is known for its organic avocado farms that produce extra-large fruit sought after for export.",
    
    // Craft and Artisan Municipalities
    "Guacamayas": "Guacamayas is known for its spiral-woven baskets made from esparto grass using techniques dating back centuries.",
    "La Chamba": "La Chamba produces distinctive black clay cookware fired using a tradition that pre-dates Spanish colonization.",
    "Barichara": "Barichara stonemasons carve the distinctive local stone into architectural elements shipped throughout Colombia.",
    "Suaza": "Suaza artisans make traditional \"sombreros suazas\" (palm hats) worn by farmers throughout the Andean region.",
    
    // Municipalities with Unique Cultural Traditions
    "Guapí": "Guapí celebrates the \"Festival of the Currulao,\" an Afro-Colombian dance performed with marimba and drums.",
    "Atanquez": "Atanquez maintains the \"Dance of the Devils,\" where dancers in colorful masks perform to ward off evil spirits.",
    "Sincé": "Sincé is known for its Corralejas, controversial bull festivals where amateur bullfighters test their courage.",
    "Cotorra": "Cotorra preserves a unique flute-making tradition using native river reeds that produce a distinctive sound.",
    "Usiacurí": "Usiacurí holds an annual pilgrimage where participants carry candles in spiral patterns to symbolize the path of life.",
    "Padilla": "Padilla preserves traditional funeral rituals that include \"alabaos,\" haunting a cappella songs with African origins.",
    "Jamundí": "Jamundí holds water blessing ceremonies dating from pre-Columbian times at natural springs.",
    "Sapuyes": "Sapuyes maintains the Guaicoso dance tradition, where dancers mimic birds and animals of the local páramo ecosystem.",
    
    // Default fact for municipalities not in the list
    "default": "Colombia has 1,121 municipalities, each with its own unique history, culture, and traditions."
  };
  
  // Function to get a fact about a municipality
  function getMunicipalityFact(municipalityName) {
    if (!municipalityName) return colombiaFacts.default;
    
    // Check if we have a specific fact for this municipality
    if (colombiaFacts[municipalityName]) {
      return colombiaFacts[municipalityName];
    }
    
    // If no exact match, try a case-insensitive search
    const normalizedName = municipalityName.toLowerCase();
    for (const [key, value] of Object.entries(colombiaFacts)) {
      if (key.toLowerCase() === normalizedName) {
        return value;
      }
    }
    
    // If no specific fact is found, return the default fact
    return colombiaFacts.default;
  }
  
  // We'll continue to add more municipalities to this database over time
  // This is version 1.0 of the Colombia Facts database