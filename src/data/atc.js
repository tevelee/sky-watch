const IATA_TO_ICAO = {
  // Central & Eastern Europe
  BUD: 'LHBP', VIE: 'LOWW', PRG: 'LKPR', WAW: 'EPWA', KRK: 'EPKK',
  BTS: 'LZIB', OTP: 'LROP', SOF: 'LBSF', BEG: 'LYBE', ZAG: 'LDZA',
  LJU: 'LJLJ', BRQ: 'LKTB', KBP: 'UKBB', SVO: 'UUEE', DME: 'UUDD',
  // Western Europe
  LHR: 'EGLL', LGW: 'EGKK', MAN: 'EGCC', STN: 'EGSS', LTN: 'EGGW', EDI: 'EGPH',
  CDG: 'LFPG', ORY: 'LFPO', NCE: 'LFMN', MRS: 'LFML', LYS: 'LFLL', BOD: 'LFBD',
  AMS: 'EHAM', BRU: 'EBBR', CRL: 'EBCI',
  FRA: 'EDDF', MUC: 'EDDM', BER: 'EDDB', DUS: 'EDDL', HAM: 'EDDH', STR: 'EDDS',
  ZRH: 'LSZH', GVA: 'LSGG', BSL: 'LFSB',
  MAD: 'LEMD', BCN: 'LEBL', PMI: 'LEPA', AGP: 'LEMG', VLC: 'LEVC', TFS: 'GCTS',
  LIS: 'LPPT', OPO: 'LPPR', FAO: 'LPFR',
  FCO: 'LIRF', MXP: 'LIMC', VCE: 'LIPZ', NAP: 'LIRN', BGY: 'LIME', BLQ: 'LIPB',
  ATH: 'LGAV', SKG: 'LGTS', HER: 'LGIR', RHO: 'LGRP',
  // Scandinavia & Baltics
  ARN: 'ESSA', OSL: 'ENGM', BGO: 'ENBR', CPH: 'EKCH', HEL: 'EFHK',
  TLL: 'EETN', RIX: 'EVRA', VNO: 'EYVI',
  // Turkey & Middle East
  IST: 'LTBA', SAW: 'LTFJ', AYT: 'LTAI', ESB: 'LTAC', ADB: 'LTBJ',
  DXB: 'OMDB', AUH: 'OMAA', DOH: 'OTHH', KWI: 'OKBK', BAH: 'OBBI',
  RUH: 'OERK', JED: 'OEJN', AMM: 'OJAM', BEY: 'OLBA', TLV: 'LLBG',
  GYD: 'UBBB', TBS: 'UGTB', EVN: 'UDYZ',
  // South & Southeast Asia
  SIN: 'WSSS', KUL: 'WMKK', BKK: 'VTBS', DMK: 'VTBD', CGK: 'WIII',
  DPS: 'WADD', MNL: 'RPLL', SGN: 'VVTS', HAN: 'VVNB', RGN: 'VYYY',
  BOM: 'VABB', DEL: 'VIDP', MAA: 'VOMM', BLR: 'VOBL', HYD: 'VOHS', CCU: 'VECC',
  KTM: 'VNKT', CMB: 'VCBI', DAC: 'VGHS', KHI: 'OPKC', LHE: 'OPLA', ISB: 'OPRN',
  // East Asia
  HKG: 'VHHH', ICN: 'RKSI', GMP: 'RKSS', PUS: 'RKPK',
  NRT: 'RJAA', HND: 'RJTT', KIX: 'RJBB', NGO: 'RJGG', CTS: 'RJCC', FUK: 'RJFF',
  PEK: 'ZBAA', PKX: 'ZBAD', PVG: 'ZSPD', SHA: 'ZSSS', CAN: 'ZGGG',
  CTU: 'ZUUU', KMG: 'ZPPP', XIY: 'ZLXY', WUH: 'ZHHH', CSX: 'ZGHA',
  // North America — US
  JFK: 'KJFK', EWR: 'KEWR', LGA: 'KLGA', BOS: 'KBOS', IAD: 'KIAD', DCA: 'KDCA', PHL: 'KPHL', BWI: 'KBWI',
  LAX: 'KLAX', SFO: 'KSFO', SEA: 'KSEA', LAS: 'KLAS', PHX: 'KPHX', SAN: 'KSAN', PDX: 'KPDX', SLC: 'KSLC',
  ORD: 'KORD', MDW: 'KMDW', DTW: 'KDTW', MSP: 'KMSP', STL: 'KSTL', MKE: 'KMKE', CLE: 'KCLE', IND: 'KIND',
  ATL: 'KATL', MIA: 'KMIA', FLL: 'KFLL', MCO: 'KMCO', TPA: 'KTPA', CLT: 'KCLT', RDU: 'KRDU',
  DFW: 'KDFW', IAH: 'KIAH', HOU: 'KHOU', AUS: 'KAUS', SAT: 'KSAT', MSY: 'KMSY',
  DEN: 'KDEN', OAK: 'KOAK', SJC: 'KSJC', BUR: 'KBUR', ONT: 'KONT',
  // Canada
  YYZ: 'CYYZ', YVR: 'CYVR', YUL: 'CYUL', YYC: 'CYYC', YEG: 'CYEG', YOW: 'CYOW', YWG: 'CYWG',
  // Mexico & Caribbean
  MEX: 'MMMX', CUN: 'MMUN', GDL: 'MMGL', MTY: 'MMMY', MID: 'MMMD',
  MBJ: 'MKJS', NAS: 'MYNN', PUJ: 'MDPC', SJU: 'TJSJ',
  // Central & South America
  GUA: 'MGGT', SAP: 'MHLM', SJO: 'MROC', PTY: 'MPTO',
  BOG: 'SKBO', MDE: 'SKRG', CLO: 'SKCL', UIO: 'SEQM', LIM: 'SPJC',
  SCL: 'SCEL', EZE: 'SAEZ', AEP: 'SABE', GRU: 'SBGR', GIG: 'SBGL', BSB: 'SBBR',
  FOR: 'SBFZ', REC: 'SBRF', SSA: 'SBSV', POA: 'SBPA', CWB: 'SBCT',
  // Africa
  JNB: 'FAOR', CPT: 'FACT', DUR: 'FALE',
  CAI: 'HECA', LXR: 'HELX', HRG: 'HEGN', SSH: 'HESH',
  CMN: 'GMMN', RAK: 'GMMX', ALG: 'DAAG', TUN: 'DTTA', TIP: 'HLLT',
  NBO: 'HKJK', ADD: 'HAAB', DAR: 'HTDA', EBB: 'HUEN',
  ACC: 'DGAA', LOS: 'DNMM', ABV: 'DNAA', ABJ: 'DIAP',
  // Oceania
  SYD: 'YSSY', MEL: 'YMML', BNE: 'YBBN', PER: 'YPPH', ADL: 'YPAD', CNS: 'YBCS',
  AKL: 'NZAA', CHC: 'NZCH', WLG: 'NZWN',
}

export function getIcao(iata) {
  return IATA_TO_ICAO[iata?.toUpperCase()] ?? null
}

export function atcUrl(iata) {
  const icao = getIcao(iata)
  if (icao) return `https://www.liveatc.net/search/?icao=${icao}`
  if (iata) return `https://www.liveatc.net/search/?icao=${iata}`
  return 'https://www.liveatc.net'
}
