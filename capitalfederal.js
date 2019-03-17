/**
 * ar.com.propinmueble.geomap.data.ar.capitalfederal:   Coleccion de las Areas de los barrios de capital federal.
 *      width:  Ancho del mapa.
 *      height: Alto del mapa.
 *      areas:  Coleccion de regiones que componen el mapa.
 *              name:   Nombre de la region.
 *              points: Coleccion de puntos. Son los vertices del poligono que delimita la region.
 *                                      Los puntos estan ordenados en sentido horario y el primero de ellos es el que esta mas al norte.
 *              north:  Posicion en @points del punto que mas al norte esta.
 *              east:   Posicion en @points del punto que mas al este esta.
 *              south:  Posicion en @points del punto que mas al sur esta.
 *              west:   Posicion en @points del punto que mas al oeste esta.
 */
var ar;
if (!ar) ar = {};
if (!ar.com) ar.com = {};
if (!ar.com.propinmueble) ar.com.propinmueble = {};
if (!ar.com.propinmueble.geomap) ar.com.propinmueble.geomap = {};
if (!ar.com.propinmueble.geomap.data) ar.com.propinmueble.geomap.data = {};
if (!ar.com.propinmueble.geomap.data.ar) ar.com.propinmueble.geomap.data.ar = {};


ar.com.propinmueble.geomap.data.ar.capitalfederal = {
    width: 378,
    height: 415,
    areas: [
        { 
            name: "Nuñez",
            points: [
                {x: 137, y:3},
                {x: 166, y:25},
                {x: 157, y:45},
                {x: 127, y:65},
                {x: 117, y:50},
                {x: 126, y:41},
                {x: 113, y:15}
            ],
            north: 3,
            east: 166,
            south: 65,
            west: 113
        },{
            name: "Saavedra",
            points: [
                {x: 113, y:15},
                {x: 126, y:41},
                {x: 117, y:50},
                {x: 117, y:53},
                {x: 113, y:51},
                {x: 80, y:73},
                {x: 76, y:71},
                {x: 45, y:91},
                {x: 64, y:39}
            ],
            north: 15,
            east: 126,
            south: 91,
            west: 45
        },{
            name: "Belgrano",
            points: [
                {x: 166, y:25},
                {x: 184, y:35},
                {x: 197, y:50},
                {x: 184, y:62},
                {x: 185, y:73},
                {x: 170, y:87},
                {x: 159, y:83},
                {x: 141, y:103},
                {x: 132, y:99},
                {x: 127, y:99},
                {x: 118, y:85},
                {x: 130, y:73},
                {x: 127, y:65},
                {x: 157, y:45}
            ],
            north: 25,
            east: 197,
            south: 103,
            west: 118
        },{
            name: "Palermo",
            points: [
                {x: 211, y:41},
                {x: 218, y:42},
                {x: 220, y:49},
                {x: 227, y:49},
                {x: 251, y:65},
                {x: 260, y:79},
                {x: 264, y:79},
                {x: 270, y:77},
                {x: 274, y:81},
                {x: 270, y:87},
                {x: 270, y:90},
                {x: 274, y:91},
                {x: 268, y:109},
                {x: 275, y:117},
                {x: 269, y:130},
                {x: 258, y:129},
                {x: 241, y:153},
                {x: 238, y:161},
                {x: 216, y:161},
                {x: 193, y:139},
                {x: 179, y:131},
                {x: 179, y:125},
                {x: 187, y:117},
                {x: 182, y:107},
                {x: 185, y:99},
                {x: 170, y:87},
                {x: 185, y:73},
                {x: 183, y:63},
                {x: 197, y:51},
                {x: 202, y:50}
            ],
            north: 41,
            east: 275,
            south: 161,
            west: 170
        },{
            name: "Coghlan",
            points: [
                {x: 117, y:50},
                {x: 127, y:65},
                {x: 130, y:73},
                {x: 118, y:85},
                {x: 113, y:85},
                {x: 98, y:71},
                {x: 96, y:63},
                {x: 113, y:51},
                {x: 117, y:53}
            ],
            north: 50,
            east: 130,
            south: 85,
            west: 96
        },{
            name: "Villa Urquiza",
            points: [
                {x: 96, y:63},
                {x: 98, y:71},
                {x: 113, y:85},
                {x: 118, y:85},
                {x: 127, y:99},
                {x: 110, y:113},
                {x: 105, y:118},
                {x: 88, y:129},
                {x: 77, y:117},
                {x: 74, y:117},
                {x: 54, y:98},
                {x: 45, y:91},
                {x: 76, y:71},
                {x: 80, y:73}
            ],
            north: 63,
            east: 127,
            south: 128,
            west: 45
        },{
            name: "Colegiales",
            points: [
                {x: 159, y:83},
                {x: 170, y:87},
                {x: 185, y:99},
                {x: 182, y:107},
                {x: 187, y:117},
                {x: 179, y:125},
                {x: 146, y:117},
                {x: 141, y:103}
                ],
            north: 83,
            east: 187,
            south: 125,
            west: 141
        },{
            name: "Villa Pueyrredón",
            points: [
                {x: 45, y:91},
                {x: 54, y:98},
                {x: 74, y:117},
                {x: 77, y:117},
                {x: 88, y:129},
                {x: 54, y:153},
                {x: 47, y:143},
                {x: 47, y:139},
                {x: 34, y:121}
            ],
            north: 91,
            east: 88,
            south: 153,
            west: 34
        },{
            name: "Recoleta",
            points: [
                {x: 274, y:91},
                {x: 276, y:94},
                {x: 279, y:97},
                {x: 286, y:99},
                {x: 299, y:109},
                {x: 301, y:117},
                {x: 303, y:117},
                {x: 313, y:121},
                {x: 296, y:149},
                {x: 298, y:153},
                {x: 298, y:165},
                {x: 293, y:169},
                {x: 286, y:169},
                {x: 272, y:169},
                {x: 263, y:165},
                {x: 259, y:166},
                {x: 245, y:165},
                {x: 238, y:161},
                {x: 241, y:153},
                {x: 258, y:129},
                {x: 269, y:130},
                {x: 275, y:117},
                {x: 268, y:109}
            ],
            north: 91,
            east: 313,
            south: 169,
            west: 238
        },{
            name: "Retiro",
            points: [
                {x: 290, y:93},
                {x: 308, y:93},
                {x: 337, y:117},
                {x: 344, y:119},
                {x: 349, y:121},
                {x: 351, y:125},
                {x: 353, y:135},
                {x: 338, y:143},
                {x: 342, y:151},
                {x: 338, y:157},
                {x: 331, y:163},
                {x: 298, y:165},
                {x: 298, y:153},
                {x: 296, y:149},
                {x: 313, y:121},
                {x: 303, y:117},
                {x: 301, y:117},
                {x: 299, y:109},
                {x: 302, y:109},
                {x: 304, y:107},
                {x: 303, y:103}
            ],
            north: 93,
            east: 353,
            south: 165,
            west: 290
        },{
            name: "Villa Ortuzar",
            points: [
                {x: 127, y:99},
                {x: 132, y:99},
                {x: 141, y:103},
                {x: 146, y:117},
                {x: 145, y:135},
                {x: 133, y:145},
                {x: 123, y:138},
                {x: 117, y:121},
                {x: 113, y:119},
                {x: 111, y:113}
            ],
            north: 99,
            east: 146,
            south: 145,
            west: 111
        },{
            name: "Parque Chas",
            points: [
                {x: 111, y:113},
                {x: 113, y:119},
                {x: 117, y:121},
                {x: 123, y:138},
                {x: 114, y:145},
                {x: 112, y:146},
                {x: 98, y:145},
                {x: 88, y:129},
                {x: 105, y:118}
            ],
            north: 113,
            east: 123,
            south: 146,
            west: 88
        },{
            name: "Chacarita",
            points: [
                {x: 146, y:117},
                {x: 179, y:125},
                {x: 179, y:131},
                {x: 175, y:145},
                {x: 153, y:163},
                {x: 145, y:159},
                {x: 135, y:161},
                {x: 137, y:151},
                {x: 133, y:145},
                {x: 145, y:135}
            ],
            north: 117,
            east: 179,
            south: 163,
            west: 133
        },{
            name: "Villa Devoto",
            points: [
                {x: 34, y:121},
                {x: 47, y:139},
                {x: 47, y:143},
                {x: 54, y:153},
                {x: 67, y:161},
                {x: 53, y:173},
                {x: 62, y:191},
                {x: 28, y:217},
                {x: 8, y:195}
            ],
            north: 121,
            east: 67,
            south: 217,
            west: 8
        },{
            name: "Agronomía",
            points: [
                {x: 88, y:129},
                {x: 98, y:145},
                {x: 112, y:146},
                {x: 108, y:166},
                {x: 99, y:161},
                {x: 67, y:161},
                {x: 54, y:153}
            ],
            north: 129,
            east: 112,
            south: 166,
            west: 54
        },{
            name: "Villa Crespo",
            points: [
                {x: 179, y:131},
                {x: 193, y:139},
                {x: 216, y:161},
                {x: 210, y:165},
                {x: 201, y:175},
                {x: 180, y:185},
                {x: 166, y:185},
                {x: 151, y:179},
                {x: 154, y:173},
                {x: 153, y:163},
                {x: 175, y:145}
            ],
            north: 131,
            east: 216,
            south: 185,
            west: 151
        },{
            name: "Puerto Madero",
            points: [
                {x: 353, y:135},
                {x: 366, y:177},
                {x: 373, y:185},
                {x: 367, y:201},
                {x: 367, y:229},
                {x: 365, y:245},
                {x: 350, y:229},
                {x: 347, y:229},
                {x: 345, y:221},
                {x: 345, y:213},
                {x: 344, y:209},
                {x: 344, y:189},
                {x: 341, y:186},
                {x: 341, y:167},
                {x: 338, y:157},
                {x: 342, y:153},
                {x: 338, y:143}
            ],
            north: 135,
            east: 373,
            south: 245,
            west: 338
        },{
            name: "Paternal",
            points: [
                {x: 123, y:138},
                {x: 133, y:145},
                {x: 137, y:151},
                {x: 135, y:161},
                {x: 145, y:159},
                {x: 153, y:163},
                {x: 153, y:163},
                {x: 154, y:173},
                {x: 151, y:179},
                {x: 128, y:173},
                {x: 117, y:179},
                {x: 108, y:166},
                {x: 112, y:146},
                {x: 114, y:145}
            ],
            north: 138,
            east: 154,
            south: 179,
            west: 107
        },{
            name: "San Nicolas",
            points: [
                {x: 338, y:157},
                {x: 341, y:167},
                {x: 341, y:186},
                {x: 315, y:187},
                {x: 314, y:189},
                {x: 288, y:191},
                {x: 286, y:169},
                {x: 293, y:169},
                {x: 298, y:165},
                {x: 331, y:163}
            ],
            north: 157,
            east: 341,
            south: 191,
            west: 286
        },{
            name: "Almagro",
            points: [
                {x: 216, y:161},
                {x: 238, y:161},
                {x: 245, y:165},
                {x: 242, y:189},
                {x: 238, y:197},
                {x: 243, y:201},
                {x: 245, y:219},
                {x: 213, y:221},
                {x: 211, y:209},
                {x: 207, y:207},
                {x: 207, y:185},
                {x: 201, y:175},
                {x: 210, y:165}
            ],
            north: 161,
            east: 245,
            south: 221,
            west: 201
        },{
            name: "Villa del Parque",
            points: [
                {x: 67, y:161},
                {x: 99, y:161},
                {x: 108, y:166},
                {x: 117, y:179},
                {x: 111, y:186},
                {x: 106, y:189},
                {x: 87, y:193},
                {x: 75, y:205},
                {x: 62, y:191},
                {x: 53, y:173}
            ],
            north: 161,
            east: 117,
            south: 205,
            west: 53
        },{
            name: "Balvanera",
            points: [
                {x: 245, y:165},
                {x: 259, y:166},
                {x: 263, y:165},
                {x: 272, y:169},
                {x: 286, y:169},
                {x: 288, y:191},
                {x: 287, y:213},
                {x: 261, y:215},
                {x: 245, y:219},
                {x: 243, y:201},
                {x: 238, y:197},
                {x: 242, y:189}
            ],
            north: 165,
            east: 288,
            south: 219,
            west: 242
        },{
            name: "Villa Gral. Mitre",
            points: [
                {x: 128, y:173},
                {x: 151, y:179},
                {x: 142, y:189},
                {x: 147, y:203},
                {x: 122, y:214},
                {x: 106, y:189},
                {x: 111, y:186},
                {x: 117, y:179}
            ],
            north: 173,
            east: 150,
            south: 214,
            west: 106
        },{
            name: "Caballito",
            points: [
                {x: 201, y:175},
                {x: 207, y:185},
                {x: 207, y:207},
                {x: 211, y:209},
                {x: 213, y:221},
                {x: 215, y:235},
                {x: 166, y:245},
                {x: 147, y:203},
                {x: 142, y:189},
                {x: 151, y:179},
                {x: 166, y:185},
                {x: 180, y:185}
            ],
            north: 175,
            east: 215,
            south: 245,
            west: 142
        },{
            name: "Monserrat",
            points: [
                {x: 341, y:186},
                {x: 344, y:189},
                {x: 344, y:209},
                {x: 317, y:208},
                {x: 316, y:212},
                {x: 287, y:213},
                {x: 288, y:191},
                {x: 314, y:189},
                {x: 315, y:187}
            ],
            north: 186,
            east: 344,
            south: 213,
            west: 288
        },{
            name: "Villa Santa Rita",
            points: [
                {x: 106, y:189},
                {x: 122, y:214},
                {x: 109, y:223},
                {x: 99, y:229},
                {x: 74, y:206},
                {x: 87, y:193}
            ],
            north: 189,
            east: 122,
            south: 229,
            west: 74
        },{
            name: "Monte Castro",
            points: [
                {x: 62, y:191},
                {x: 75, y:205},
                {x: 79, y:209},
                {x: 69, y:222},
                {x: 61, y:225},
                {x: 50, y:237},
                {x: 41, y:229},
                {x: 30, y:238},
                {x: 18, y:226},
                {x: 28, y:217}
            ],
            north: 191,
            east: 79,
            south: 238,
            west: 18
        },{
            name: "Villa Real",
            points: [
                {x: 8, y:195},
                {x: 28, y:217},
                {x: 18, y:226},
                {x: 7, y:236},
                {x: 3, y:209}
            ],
            north: 195,
            east: 28,
            south: 236,
            west: 3
        },{
            name: "Flores",
            points: [
                {x: 147, y:203},
                {x: 166, y:245},
                {x: 159, y:246},
                {x: 167, y:265},
                {x: 178, y:274},
                {x: 180, y:271},
                {x: 185, y:277},
                {x: 191, y:285},
                {x: 180, y:295},
                {x: 170, y:293},
                {x: 169, y:296},
                {x: 158, y:294},
                {x: 143, y:309},
                {x: 132, y:296},
                {x: 139, y:284},
                {x: 127, y:274},
                {x: 122, y:259},
                {x: 109, y:223},
                {x: 122, y:214}
            ],
            north: 203,
            east: 191,
            south: 309,
            west: 109
        },{
            name: "San Telmo",
            points: [
                {x: 317, y:208},
                {x: 344, y:209},
                {x: 345, y:213},
                {x: 345, y:221},
                {x: 347, y:229},
                {x: 335, y:232},
                {x: 337, y:234},
                {x: 335, y:236},
                {x: 333, y:237},
                {x: 330, y:237},
                {x: 329, y:235},
                {x: 319, y:234},
                {x: 316, y:212}                         
            ],
            north: 208,
            east: 347,
            south: 237,
            west: 316
        },{
            name: "Floresta",
            points: [
                {x: 79, y:209},
                {x: 99, y:229},
                {x: 109, y:223},
                {x: 122, y:259},
                {x: 112, y:266},
                {x: 69, y:222}
            ],
            north: 209,
            east: 122,
            south: 266,
            west: 69
        },{
            name: "Constitución",
            points: [
                {x: 316, y:212},
                {x: 319, y:234},
                {x: 319, y:235},
                {x: 314, y:240},
                {x: 311, y:248},
                {x: 309, y:243},
                {x: 302, y:249},
                {x: 289, y:252},
                {x: 286, y:237},
                {x: 287, y:213}
            ],
            north: 212,
            east: 319,
            south: 252,
            west: 286
        },{
            name: "San Cristobal",
            points: [
                {x: 287, y:213},
                {x: 286, y:237},
                {x: 264, y:240},
                {x: 246, y:244},
                {x: 245, y:219},
                {x: 261, y:215}
            ],
            north: 213,
            east: 287,
            south: 244,
            west: 245
        },{
            name: "Boedo",
            points: [
                {x: 245, y:219},
                {x: 246, y:244},
                {x: 245, y:251},
                {x: 247, y:254},
                {x: 248, y:261},
                {x: 244, y:265},
                {x: 238, y:265},
                {x: 219, y:268},
                {x: 215, y:235},
                {x: 213, y:221}
            ],
            north: 219,
            east: 248,
            south: 268,
            west: 213
        },{
            name: "Velez Sarsfield",
            points: [
                {x: 69, y:222},
                {x: 106, y:260},
                {x: 89, y:270},
                {x: 66, y:246},
                {x: 59, y:247},
                {x: 50, y:237},
                {x: 61, y:225}
            ],
            north: 222,
            east: 106,
            south: 270,
            west: 50
        },{
            name: "Versalles",
            points: [
                {x: 18, y:226},
                {x: 45, y:255},
                {x: 41, y:254},
                {x: 39, y:253},
                {x: 36, y:253},
                {x: 31, y:252},
                {x: 26, y:252},
                {x: 21, y:253},
                {x: 18, y:254},
                {x: 13, y:252},
                {x: 10, y:250},
                {x: 9, y:246},
                {x: 7, y:236}
            ],
            north: 226,
            east: 45,
            south: 255,
            west: 7
        },{
            name: "Villa Luro",
            points: [
                {x: 41, y:229},
                {x: 50, y:237},
                {x: 59, y:247},
                {x: 66, y:246},
                {x: 89, y:270},
                {x: 73, y:280},
                {x: 69, y:276},
                {x: 58, y:282},
                {x: 40, y:265},
                {x: 41, y:254},
                {x: 45, y:255},
                {x: 30, y:238}
            ],
            north: 229,
            east: 89,
            south: 282,
            west: 30
        },{
            name: "Boca",
            points: [
                {x: 347, y:229},
                {x: 350, y:229},
                {x: 365, y:245},                                
                {x: 366, y:252},
                {x: 366, y:254},
                {x: 365, y:256},
                {x: 364, y:258},
                {x: 363, y:261},
                {x: 361, y:263},
                {x: 358, y:264},
                {x: 355, y:265},
                {x: 351, y:265},
                {x: 349, y:266},
                {x: 349, y:268},
                {x: 349, y:270},
                {x: 351, y:270},
                {x: 354, y:272},
                {x: 355, y:273},
                {x: 357, y:275},
                {x: 357, y:278},
                {x: 357, y:278},
                {x: 355, y:281},
                {x: 353, y:282},
                {x: 346, y:289},
                {x: 336, y:290},
                {x: 330, y:237},
                {x: 333, y:237},
                {x: 335, y:236},
                {x: 337, y:234},
                {x: 335, y:232}
            ],
            north: 229,
            east: 366,
            south: 290,
            west: 330
        },{
            name: "Barracas",
            points: [
                {x: 319, y:234},
                {x: 329, y:235},
                {x: 330, y:237},
                {x: 336, y:290},
                {x: 335, y:293},
                {x: 331, y:294},
                {x: 331, y:300},
                {x: 333, y:302},
                {x: 326, y:304},
                {x: 323, y:309},
                {x: 315, y:309},
                {x: 314, y:312},
                {x: 300, y:311},
                {x: 290, y:321},
                {x: 285, y:321},
                {x: 277, y:320},
                {x: 276, y:316},
                {x: 272, y:314},
                {x: 269, y:289},
                {x: 273, y:282},
                {x: 286, y:276},
                {x: 286, y:271},
                {x: 289, y:269},
                {x: 289, y:252},
                {x: 302, y:249},
                {x: 309, y:243},
                {x: 311, y:248},
                {x: 314, y:240},
                {x: 319, y:235}
            ],
            north: 234,
            east: 336,
            south: 321,
            west: 269
        },{
            name: "Parque Chacabuco",
            points: [
                {x: 215, y:235},
                {x: 219, y:268},                                
                {x: 203, y:272},
                {x: 202, y:280},
                {x: 191, y:285},
                {x: 185, y:277},
                {x: 180, y:271},
                {x: 178, y:274},
                {x: 167, y:265},
                {x: 159, y:246},
                {x: 166, y:245}
            ],
            north: 235,
            east: 219,
            south: 285,
            west: 159
        },{
            name: "Parque Patricios",
            points: [
                {x: 286, y:237},
                {x: 289, y:252},
                {x: 289, y:269},
                {x: 286, y:271},
                {x: 286, y:276},
                {x: 273, y:282},
                {x: 245, y:290},
                {x: 242, y:277},
                {x: 244, y:265},
                {x: 248, y:261},
                {x: 247, y:254},
                {x: 245, y:251},
                {x: 246, y:244},
                {x: 264, y:240}
            ],
            north: 237,
            east: 280,
            south: 290,
            west: 242
        },{
            name: "Liniers",
            points: [
                {x: 10, y:250},
                {x: 13, y:252},
                {x: 18, y:254},
                {x: 21, y:253},
                {x: 26, y:252},
                {x: 31, y:252},
                {x: 36, y:253},
                {x: 39, y:253},
                {x: 41, y:254},
                {x: 40, y:265},
                {x: 58, y:282},
                {x: 23, y:299},
                {x: 19, y:296}
            ],
            north: 250,
            east: 58,
            south: 299,
            west: 10
        },{
            name: "Parque Avellaneda",
            points: [
                {x: 122, y:259},
                {x: 127, y:274},
                {x: 139, y:284},
                {x: 132, y:296},
                {x: 143, y:309},
                {x: 125, y:328},
                {x: 106, y:313},
                {x: 73, y:280},
                {x: 89, y:270},
                {x: 106, y:260},
                {x: 112, y:266}
            ],
            north: 259,
            east: 143,
            south: 328,
            west: 73
        },{
            name: "Nueva Pompeya",
            points: [
                {x: 238, y:265},
                {x: 244, y:265},
                {x: 242, y:277},
                {x: 245, y:290},
                {x: 273, y:282},
                {x: 269, y:289},
                {x: 272, y:314},                                
                {x: 270, y:319},
                {x: 258, y:319},
                {x: 255, y:316},
                {x: 251, y:314},
                {x: 247, y:313},
                {x: 240, y:312},
                {x: 234, y:313},
                {x: 230, y:314},
                {x: 223, y:317},
                {x: 217, y:321},
                {x: 214, y:314},
                {x: 198, y:300},
                {x: 190, y:306},
                {x: 180, y:295},
                {x: 191, y:285},
                {x: 202, y:280},
                {x: 203, y:272},
                {x: 219, y:268}
            ],
            north: 265,
            east: 273,
            south: 321,
            west: 180
        },{
            name: "Mataderos",
            points: [
                {x: 69, y:276},
                {x: 73, y:280},
                {x: 106, y:313},
                {x: 91, y:325},
                {x: 87, y:322},
                {x: 77, y:338},
                {x: 70, y:342},
                {x: 23, y:299},
                {x: 58, y:282}
            ],
            north: 276,
            east: 106,
            south: 342,
            west: 23
        },{
            name: "Villa Soldati",
            points: [
                {x: 158, y:294},
                {x: 169, y:296},
                {x: 170, y:293},
                {x: 180, y:295},
                {x: 190, y:306},
                {x: 198, y:300},
                {x: 214, y:314},
                {x: 217, y:321},
                {x: 215, y:324},
                {x: 212, y:326},
                {x: 209, y:330},
                {x: 206, y:334},
                {x: 202, y:340},
                {x: 199, y:345},
                {x: 194, y:353},
                {x: 191, y:357},
                {x: 190, y:359},
                {x: 187, y:358},
                {x: 175, y:371},
                {x: 155, y:354},
                {x: 125, y:328},
                {x: 143, y:309}
            ],
            north: 294,
            east: 217,
            south: 371,
            west: 125
        },{
            name: "Villa Lugano",
            points: [
                {x: 106, y:313},
                {x: 125, y:328},
                {x: 155, y:354},
                {x: 136, y:375},
                {x: 117, y:358},
                {x: 102, y:372},
                {x: 70, y:342},
                {x: 77, y:338},
                {x: 87, y:322},
                {x: 91, y:325}
            ],
            north: 313,
            east: 155,
            south: 375,
            west: 70
        },{
            name: "Villa Riachuelo",
            points: [
                {x: 155, y:354},
                {x: 175, y:371},
                {x: 142, y:408},
                {x: 102, y:372},
                {x: 117, y:358},
                {x: 136, y:375}
            ],
            north: 354,
            east: 175,
            south: 408,
            west: 102
        }
    ]
};
