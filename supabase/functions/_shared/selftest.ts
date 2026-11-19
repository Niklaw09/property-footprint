// Built-in accuracy self-test: scans 20 real homes (10 sold in fall 2026, 10 more in new markets) and reports how many of their known pages were found.
// `expect` is the original hand-collected list. `confirmed` adds the pages a live run found with an exact address
// match and that were checked by hand after the Nov 19, 2026 runs (junk, other homes and unverifiable social posts left out).
// Together they are the page list the headline score is measured against. Add new real pages here after each run.
import { parseAddress } from './address.ts';
import { runScan, type EngineOptions } from './engine.ts';
import { isPrioritySite, siteFor } from './sites.ts';
import type { Candidate, PortalLookup, SearchProvider, SearchQuery } from './providers.ts';

/**
 * The headline counts priority sites only: major portals, national brokerages, social and video. These are
 * the pages a homeowner handles one by one. Small agent (IDX) sites copy the MLS and are cleared by one
 * request to the listing agent, so they count toward "all pages" but not the headline.
 */
export function isNamedSite(url: string): boolean {
  return isPrioritySite(siteFor(url));
}

/** Set A: the first 10 homes (Nov 18). Set B: 10 more added Nov 19 for new markets: a Chicago and a Somerville condo,
 *  rural Vermont, Seattle, San Diego, Las Vegas new construction, Columbus, Raleigh, Kansas City and Houston. */
export const SELFTEST_HOMES: { address: string; set?: 'A' | 'B'; expect: string[]; confirmed?: string[] }[] = [
  {
    "address": "14425 American Kestrel Dr, Austin, TX 78738",
    "expect": [
      "https://www.redfin.com/TX/Austin/14425-American-Kestrel-Dr-78738/home/30962292",
      "https://www.zillow.com/homedetails/70333738_zpid/",
      "https://www.estately.com/listings/info/14425-american-kestrel-dr-austin-tx-78738--2",
      "https://har.com/homedetail/14425-american-kestrel-dr-austin-tx-78738/6791779",
      "https://thekeenangroup.com/14425-american-kestrel-dr-austin-tx-78738",
      "https://www.spyglassrealty.com/listing/5322164-14425-american-kestrel-drive-austin-tx-78738",
      "https://ashbyre.realgeeks.com/property/3777682/",
      "https://robertjfischer.realgeeks.com/property/3777682/",
      "https://www.houzeo.com/homes/14425-american-kestrel-dr-austin-tx-78738/hzid_6394d63e",
      "https://neuhausre.com/properties/austin/14425-american-kestrel-dr-01257001460000"
    ],
    "confirmed": [
      "https://www.coldwellbanker.com/tx/austin/14425-american-kestrel-dr/lid-P00800000HErurIxBo8dEQKHUT4iwp5I08sPZckG",
      "https://www.compass.com/homedetails/14425-American-Kestrel-Dr-Austin-TX-78738/1BZA4M_pid/",
      "https://www.bhgre.com/home/detail/tx/austin/14425-american-kestrel-dr/lid-P00800000HErurIxBo8dEQKHUT4iwp5I08sPZckG",
      "https://colecapper.prod.consumer.kw.com/property/14425-American-Kestrel-Drive-Austin-TX-78738/2142383868491834",
      "https://the-simpsons.prod.consumer.kw.com/property/14425-American-Kestrel-Drive-Austin-TX-78738/2142383868491834",
      "https://www.bhhs.com/homes-for-sale/tx/14425-american-kestrel-dr-austin-78738/pid-436488524",
      "https://antoniogomez.exprealty.com/property/105-3777682-14425-american-kestrel-dr-austin-TX-78738",
      "https://www.realtor.com/realestateandhomes-detail/14425-American-Kestrel-Dr_Austin_TX_78738_M87848-30096",
      "https://www.realtor.com/rentals/details/14425-American-Kestrel-Dr_Austin_TX_78738_M87848-30096",
      "https://www.homes.com/property/14425-american-kestrel-dr-austin-tx/k95kj5zh9w15e/",
      "https://www.atproperties.com/3777682/14425-american-kestrel-dr-austin-texas-78738-unlockmls",
      "https://www.bhhstx.com/property/105-3777682-14425-american-kestrel-dr-austin-TX-78738",
      "https://austin.towers.net/idx/mls-3777682-14425_american_kestrel_dr_austin_tx_78738",
      "https://heatherpowellgroup.com/listing/14425-american-kestrel-draustintravisresidential/",
      "https://hoot.com/homes/8784830096/14425-american-kestrel-dr-austin-tx-78738",
      "https://knoxre.com/home/14425-american-kestrel-dr-austin-tx-78738-b566afba",
      "https://bridgetramey.com/home-search/listings/3081907227210817601-14425-American-Kestrel-DR",
      "https://www.loriharingrealty.com/listings/details/14425-american-kestrel-dr-austin-tx/5322164/7616927/",
      "https://www.texasrealestatesource.com/listing/austin-tx/78738/14425-american-kestrel-dr/44-1803523164/",
      "https://treaustin.com/listing/14425-american-kestrel-dr-austin-tx-78738/ACT241393104",
      "https://www.urbanspacerealtors.com/homes/14425-american-kestrel-dr-austin-tx-78738-c7191bdfe50b49b931f414abffc8df4c/",
      "https://www.trulia.com/home/14425-american-kestrel-dr-austin-tx-78738-70333738",
      "https://www.movoto.com/austin-tx/14425-american-kestrel-dr-austin-tx-78738/pid_1zr3bh54nh/",
      "https://www.coldwellbankerhomes.com/tx/austin/14425-american-kestrel-dr/pid_72769822/",
      "https://www.sothebysrealty.com/eng/sales/detail/721-l-1602-3777682/14425-american-kestrel-drive-austin-tx-78738",
      "https://www.exprealty.com/austin-tx-real-estate/spillman-ranch-ph-01-sec-01/14425-american-kestrel-dr?listingId=88103891",
      "https://www.atproperties.com/6626168/14425-american-kestrel-dr-austin-texas-78738-unlockmls",
      "https://www.realtyaustin.com/14425-american-kestrel-dr-austin-tx-78738-4859103.html",
      "https://www.austinhomeseeker.com/listing/3777682-14425-american-kestrel-drive-austin-tx-78738/map/",
      "https://www.austintexashomes.com/real-estate/austin-texas-mls/property/3777682-14425-american-kestrel-drive-austin-tx-78738/",
      "https://www.bluelinerealtytexas.com/real-estate/14425-american-kestrel-dr-austin-tx-78738/3777682/200964067",
      "https://www.cbarealtors.com/property/105-3777682-14425-American-Kestrel-Dr-Austin-TX-78738/",
      "https://fourdirectionsrealty.com/idx/mls-3777682-14425_american_kestrel_dr_austin_tx_78738",
      "https://toddburgener.com/listing/14425-american-kestrel-dr-austin-tx-78738/ACT241393104",
      "https://www.turnkeypropertygroup.com/listings/14425-american-kestrel-dr-austin-tx-78738-act3777682"
    ]
  },
  {
    "address": "6413 York Bridge Cir, Austin, TX 78749",
    "expect": [
      "https://www.redfin.com/TX/Austin/6413-York-Bridge-Cir-78749/home/30983684",
      "https://www.zillow.com/homedetails/70334856_zpid/",
      "https://neuhausre.com/properties/austin/6413-york-bridge-cir-04203601100000/",
      "https://atproperties.com/4191638/6413-york-bridge-cir-austin-texas-78749-unlockmls"
    ],
    "confirmed": [
      "https://www.compass.com/homedetails/6413-York-Bridge-Cir-Austin-TX-78749/1FGA91_pid/",
      "https://www.century21.com/homes/detail/tx/austin/6413-york-bridge-cir/lid-P00800000HG2LeoTB2cavrFQMQyVeDhwFwPh6Qo2",
      "https://www.century21.com/homes/detail/tx/austin/6413-york-bridge-cir/lid-P00800000HIRbHwL1ZAsf409LOoNrfTDAkAEqUrI",
      "https://www.bhhs.com/homes-for-sale/tx/6413-york-bridge-cir-austin-78749/pid-437806038",
      "https://www.trulia.com/home/6413-york-bridge-cir-austin-tx-78749-70334856",
      "https://www.realtor.com/realestateandhomes-detail/6413-York-Bridge-Cir_Austin_TX_78749_M87030-89620",
      "https://www.homes.com/property/6413-york-bridge-cir-austin-tx/xslj194rpv2km/",
      "https://www.movoto.com/austin-tx/6413-york-bridge-cir-austin-tx-78749/pid_i6x3bh54nh/",
      "https://www.har.com/homedetail/6413-york-bridge-cir-austin-tx-78749/9106281",
      "https://www.coldwellbankerhomes.com/tx/austin/6413-york-bridge-circle/pid_74186534/",
      "https://www.avalaraustin.com/property/105-7982681-6413-york-bridge-cir-austin-TX-78749",
      "https://austin.towers.net/idx/mls-4191638-6413_york_bridge_cir_austin_tx_78749",
      "https://www.alexatxrealtor.com/idx/listing/TX-ABOR/4191638/6413-York-Bridge-Cir-Austin-TX-78749",
      "https://dukesresidential.com/listing/actris/4191638/Austin/6413-York-Bridge-Circle/",
      "https://easylivingaustin.com/listings/6413-york-bridge-circle-austin-tx-78749-1",
      "https://landyfrostgroup.com/listing/actris/4191638/Austin/6413-York-Bridge-Circle/",
      "https://www.spyglassrealty.com/listing/4191638-6413-york-bridge-circle-austin-tx-78749",
      "https://www.sothebysrealty.com/kuper/eng/sales/detail/721-l-1602-4191638/6413-york-bridge-circle-circle-c-ranch-austin-tx-78749",
      "https://www.era.com/property/detail/tx/austin/6413-york-bridge-cir/lid-P00800000HG2LeoTB2cavrFQMQyVeDhwFwPh6Qo2",
      "https://darinwalkeraustin.com/home-search/listings/3081259633693926748-6413-York-Bridge-CIR",
      "https://www.rmcapitalcity.com/p/6413-York-Bridge-Cir-Austin-TX-78749/dmgid_190043928",
      "https://www.search.unlockmls.com/address/6413-York-Bridge-Cir-Austin-TX-78749/7982681",
      "https://www.urbanspacerealtors.com/homes/6413-york-bridge-cir-austin-tx-78749-3ac9da55db699dd95ad7e9b40f39ef77/",
      "https://vinceyoungrealty.com/listing/6413-york-bridge-cir-austin-tx-78749/ACT248488171",
      "https://www.austintexasresidence.com/homes/6413-York-Bridge-Cir/Austin/TX/78749/181983710/",
      "https://baerealty.com/home-search/listings/3081259633693926748-6413-York-Bridge-CIR",
      "https://www.mytexashomeresource.com/idx/6413-york-bridge-cir-austin-tx-78749/1807215291_spid/?src=2"
    ]
  },
  {
    "address": "4138 E Tanglewood Dr, Phoenix, AZ 85048",
    "expect": [
      "https://www.redfin.com/AZ/Phoenix/4138-E-Tanglewood-Dr-85048/home/26878510",
      "https://www.zillow.com/homedetails/4138-E-Tanglewood-Dr-Phoenix-AZ-85048/8259511_zpid/",
      "https://valleygroupaz.realgeeks.com/property/7068179/"
    ],
    "confirmed": [
      "https://www.trulia.com/home/4138-e-tanglewood-dr-phoenix-az-85048-8259511",
      "https://www.era.com/property/detail/az/phoenix/4138-e-tanglewood-dr/lid-P00800000HFu3ZTpuzpOqpd5zJwQh4afQnKqsGFU",
      "https://www.rmxprofessionals.com/property/22-7068179-4138-e-tanglewood-drive-phoenix-AZ-85048",
      "https://www.thebergaminigroup.com/search/arizona/phoenix/remington-trace-lot-110-217-tr-a-f/4138-e-tanglewood-drive-bid-35-7068179",
      "https://www.realtor.com/realestateandhomes-detail/4138-E-Tanglewood-Dr_Phoenix_AZ_85048_M22813-31874",
      "https://www.homes.com/property/4138-e-tanglewood-dr-phoenix-az/jd5grrbgts98p/",
      "https://www.houzeo.com/homes/4138-e-tanglewood-dr-phoenix-az-85048/hzid_6e0e022d",
      "https://www.coldwellbankerhomes.com/az/phoenix/4138-e-tanglewood-dr/pid_73347091/",
      "https://www.exprealty.com/phoenix-az-real-estate/remington-trace-lot-110-217-tr-a-f/4138-e-tanglewood-dr",
      "https://blairballin.com/home/4138-e-tanglewood-dr-phoenix-az-85048-28587ded",
      "https://www.gileshometeamaz.com/search/arizona/phoenix/remington-trace-lot-110-217-tr-a-f/4138-e-tanglewood-drive-bid-35-7068179",
      "https://www.homesbymarco.com/properties/4138-e-tanglewood-dr-phoenix-az-85048/8697781/13731244"
    ]
  },
  {
    "address": "9828 Starwood Dr, Charlotte, NC 28215",
    "expect": [
      "https://www.redfin.com/NC/Charlotte/9828-Starwood-Dr-28215/home/43616099",
      "https://www.zillow.com/homedetails/5654448_zpid/",
      "https://www.johnkurtzhomes.com/listings/9828-starwood-drive-charlotte-243901778",
      "https://gnzrealty.com/home/9828-starwood-dr-charlotte-nc-28215-9e656b44"
    ],
    "confirmed": [
      "https://www.coldwellbanker.com/nc/charlotte/9828-starwood-dr/lid-P00800000HGGIxRY9jkfXsCvB2WSQFV0hLt5E7OU",
      "https://www.trulia.com/home/9828-starwood-dr-charlotte-nc-28215-5654448",
      "https://www.realtor.com/realestateandhomes-detail/9828-Starwood-Dr_Charlotte_NC_28215_M63316-54990",
      "https://www.homes.com/property/9828-starwood-dr-charlotte-nc/8r5xc8tm4bcc8/",
      "https://www.compass.com/homedetails/9828-Starwood-Dr-Charlotte-NC-28215/XP4MH_pid/",
      "https://www.coldwellbankerhomes.com/nc/charlotte/9828-starwood-dr/pid_73249016/",
      "https://www.century21.com/homes/detail/nc/charlotte/9828-starwood-dr/lid-P00800000HGGIxRY9jkfXsCvB2WSQFV0hLt5E7OU",
      "https://chadhowery.kw.com/property/9828-Starwood-Drive-Charlotte-NC-28215/2151947277211958",
      "https://www.bhhs.com/homes-for-sale/nc/9828-starwood-drive-charlotte-28215/pid-438138323",
      "https://www.bhhscarolinas.com/property/44-4418077-9828-starwood-drive-charlotte-NC-28215",
      "https://www.cbadvantage.com/showcase/9828-starwood-drive-charlotte-nc-28215/id_7028847",
      "https://www.lakenormanrealty.com/p/9828-Starwood-Drive-Charlotte-NC-28215/dmgsid_78205046",
      "https://www.seacoastrealty.com/for-sale/9828-starwood-drive-charlotte-nc-28215/id_3545483",
      "https://www.terravistarealty.com/uid/9828-Starwood-Drive/Charlotte/NC/28215/1003693384",
      "https://www.terravistarealty.com/tvid-property-details.cfm?TVID=1003693144",
      "https://hotpads.com/9828-starwood-dr-charlotte-nc-28215-1js84se/pad",
      "https://www.apartments.com/9828-starwood-dr-charlotte-nc/lqnzc9f/",
      "https://www.highgarden-charlotte.com/9828-Starwood-Dr-Charlotte-NC-28215/mls4418077",
      "https://www.housesincharlotte.com/property-search/detail/93/4418077/9828-starwood-dr-charlotte-nc-28215/",
      "https://www.land.com/property/9828-starwood-drive-charlotte-north-carolina-28215/28577070/",
      "https://www.premiersothebysrealty.com/single-family/clm/car4418077/9828-starwood-drive-charlotte-nc-28215",
      "https://www.tmrrealtyinc.com/listings/246370668/9828+Starwood+Drive%2C+Charlotte%2C+NC+28215/",
      "https://www.viewcarolinahomes.com/info/9828Starwood-Drive/Charlotte/NC/28215/mls/4418077",
      "https://www.movoto.com/charlotte-nc/9828-starwood-dr-charlotte-nc-28215/pid_mmjs3ib3jh/",
      "https://www.cbadvantage.com/for-sale/9828-starwood-drive-charlotte-nc-28215/id_7028847",
      "https://christyandcompany.callitclosed.com/listing-detail/1184387876/9828-Starwood-DR-Charlotte-NC",
      "https://www.dreamlinerealty.com/homes/9828-Starwood-Drive/Charlotte/NC/28215/177921311/",
      "https://www.highgarden-charlotte.com/9828-Starwood-Dr-Charlotte-NC-28215/mls4392082",
      "https://www.lifestylerealtync.com/property/44-4418077-9828-Starwood-Drive-Charlotte-NC-28215",
      "https://www.premiersothebysrealty.com/single-family/clm/car4392082/9828-starwood-drive-charlotte-nc-28215",
      "https://www.rinehartrealty.com/property/44-4392082-9828-Starwood-Drive-Charlotte-NC-28215"
    ]
  },
  {
    "address": "5062 Perth St, Denver, CO 80249",
    "expect": [
      "https://www.redfin.com/CO/Denver/5062-Perth-St-80249/home/34007201",
      "https://www.zillow.com/homedetails/61469624_zpid/",
      "https://austinhartley.realgeeks.com/property/6283032/",
      "https://perfecthouseforyou.realgeeks.com/property/6283032/"
    ],
    "confirmed": [
      "https://www.coldwellbanker.com/co/denver/5062-perth-st/lid-P00800000HFKNtGGaC1zyHdv3dqu1FTjF1CnD61Y",
      "https://www.era.com/property/detail/co/denver/5062-perth-st/lid-P00800000HFKNtGGaC1zyHdv3dqu1FTjF1CnD61Y",
      "https://www.trulia.com/home/5062-perth-st-denver-co-80249-61469624",
      "https://www.realtor.com/realestateandhomes-detail/5062-Perth-St_Denver_CO_80249_M22729-21204",
      "https://www.homes.com/property/5062-perth-st-denver-co/z5hw8916s4twr/",
      "https://www.compass.com/homedetails/5062-Perth-St-Denver-CO-80249/12DBCH_pid/",
      "https://www.coldwellbankerhomes.com/co/denver/5062-perth-st/pid_72945706/",
      "https://www.momentumrealtycolorado.com/property/19-6283032-5062-perth-st-denver-CO-80249",
      "https://www.slifersmithandframptonrealestate.com/property/6-6283032-5062-perth-street-denver-CO-80249",
      "https://www.elliman.com/listing/5062-perth-st-denver-co-80249/33521511",
      "https://www.explorespringshomes.com/search/colorado/denver/green-valley-ranch/5062-perth-street-bid-80-6283032",
      "https://www.firstsummitrealty.com/homes-for-sale-sold-details/5062-PERTH-STREET-DENVER-CO-80249/6283032/16/",
      "https://guidere.com/home-search/listings/7984276563312026417-5062-Perth-Street",
      "https://kennarealestate.com/home/5062-perth-st-denver-co-80249-a6a9e6ab",
      "https://klester.smartdenverhomesearch.com/property/5062-perth-st-denver-co-80249/pid-1806479401/?src=2",
      "https://rachelgallegos.com/home-search/listings/7984276563312026417-5062-Perth-Street",
      "https://www.facebook.com/kathi.farrellweaver/posts/j-u-s-t-l-i-s-t-e-d5062-perth-street-denver-co-802494-beds-3-baths-1942-sf-450kt/10235918946977179/",
      "https://www.andrewmacarthur.com/property/6-6283032-5062-perth-street-denver-CO-80249",
      "https://accessionre.com/home/5062-perth-st-denver-co-80249-a6a9e6ab",
      "https://becciconnects.com/property-search/listings/detail/5062-perth-street-denver-co-80249-6283032/",
      "https://www.corcoran.com/listing/for-sale/5062-perth-street-denver-co-80249/109321660/regionId/109",
      "https://www.prevu.com/listings/5062-perth-street-denver-co-80249-pidbe8d97a5",
      "https://www.propertycrushers.com/property-search/detail/60/6283032/5062-perth-st-denver-co-80249/",
      "https://www.jparplatinum.com/property/6-6283032-5062-perth-street-denver-CO-80249",
      "https://www.marcusteamrealtors.com/listing-detail/1187224594/5062-Perth-ST-Denver-CO"
    ]
  },
  {
    "address": "14732 San Marsala Ct, Tampa, FL 33626",
    "expect": [
      "https://www.redfin.com/FL/Tampa/14732-San-Marsala-Ct-33626/home/46976101",
      "https://www.zillow.com/homedetails/14732-San-Marsala-Ct-Tampa-FL-33626/66717357_zpid/",
      "https://tampaelitehomes.realgeeks.com/property/TB8543033/",
      "https://bosshardtrealty.clone.unionstmedia.com/listing/TB8543033/14732-san-marsala-court-tampa-fl-33626/",
      "https://www.floridaneighborhoodrealty.com/property/TB8543033/",
      "https://www.beycome.com/14732-SAN-MARSALA-COURT/STELTB8543033",
      "https://bexrealty.com/FL/Tampa/14732-san-marsala-court/home/MFRTB8543033"
    ],
    "confirmed": [
      "https://thechristianobrien.com/sold-listing/detail/1200223963/14732-SAN-MARSALA-CT-Tampa-FL",
      "https://www.realtor.com/realestateandhomes-detail/14732-San-Marsala-Ct_Tampa_FL_33626_M69071-47711",
      "https://www.homes.com/property/14732-san-marsala-ct-tampa-fl/y00rwg8zl24v4/",
      "https://www.estately.com/listings/info/14732-san-marsala-court-tampa-fl-33626",
      "https://www.coldwellbankerhomes.com/fl/tampa/14732-san-marsala-ct/pid_73299646/",
      "https://www.edinarealty.net/property/24-TB8543033-14732-san-marsala-court-tampa-FL-33626",
      "https://brianbuonaiuto.jpar.com/property/24-TB8543033-14732-san-marsala-court-tampa-FL-33626",
      "https://www.realpha.com/property/14732-san-marsala-court-tampa-fl-33626/7091854136638759705",
      "https://siftargroup.com/properties/14732-san-marsala-ct-tampa-fl-us-33626-mfrtb8543033",
      "https://singingrealtortampa.com/listing-detail/1188295991/14732-SAN-MARSALA-CT-Tampa-FL",
      "https://www.soldtheneighborhood.com/property/TB8543033/",
      "https://www.trulia.com/home/14732-san-marsala-ct-tampa-fl-33626-66717357",
      "https://www.remax.com/luxury/fl/tampa/home-details/14732-san-marsala-ct-tampa-fl-33626/293254077520120234/M00000146/TB8543033",
      "https://www.casabellaelite.com/property/24-TB8543033-14732-San-Marsala-Court-Tampa-FL-33626",
      "https://www.tahirahcreatingwealth.com/search/florida/tampa/waterchase-ph-2/14732-san-marsala-court-bid-30-TB8543033",
      "https://www.facebook.com/amanda.siftar/posts/sold-in-waterchase-14732-san-marsala-court-33626some-transactions-are-a-pleasure/10235755789937205/",
      "https://www.era.com/property/detail/fl/tampa/14732-san-marsala-ct/lid-P00800000HGNZ59t4wEFS5y1ehzR5RuRJWoTREyL",
      "https://therochegroup.org/listing-detail/1188295991/14732-SAN-MARSALA-CT-Tampa-FL",
      "https://www.besttamparealestateagents.com/property-search/detail/240/TB8543033/14732-san-marsala-ct-tampa-fl-33626/"
    ]
  },
  {
    "address": "312 Parmley Ln, Nashville, TN 37207",
    "expect": [
      "https://www.redfin.com/TN/Nashville/312-Parmley-Ln-37207/home/60679611",
      "https://www.zillow.com/homedetails/121390342_zpid/",
      "https://www.vrmproperties.com/Property-For-Sale/28501/312-parmley-ln-nashville-tn-37207",
      "https://granthammond.com/idx/mls-3602048-312_parmley_ln_nashville_tn_37207"
    ],
    "confirmed": [
      "https://www.coldwellbanker.com/tn/nashville/312-parmley-ln/lid-P00800000HI3vjK5Sek2gpyNAGB7JUVtHZS7F86v",
      "https://www.parksauctionandrealty.com/property/12-3602048-312-Parmley-Ln-Nashville-TN-37207",
      "https://www.trulia.com/home/312-parmley-ln-nashville-tn-37207-121390342",
      "https://www.realtor.com/realestateandhomes-detail/312-Parmley-Ln_Nashville_TN_37207_M88479-81438",
      "https://angelamcandrew.com/home-search/listings/4324745903676553011-312-Parmley-Ln",
      "https://www.granthammond.com/property/312-parmley-ln-nashville-tn-37207/",
      "https://henderson-team.com/listing-detail/1190000244/312-Parmley-Ln-Nashville-TN/",
      "https://maxhousere.com/home/312-parmley-ln-nashville-tn-37207-2baacd66",
      "https://www.mcarthursanders.com/homes-for-sale/312-Parmley-Ln-Nashville-TN-37207-434588014",
      "https://www.middletnhomeexpert.com/property-search/detail/38/3246933/312-parmley-ln-nashville-tn-37207/",
      "https://www.nashvillehomeviewer.com/homes-for-sale-sold-details/312-PARMLEY-LN-NASHVILLE-TN-37207/3246933/61/",
      "https://www.nashvillesmls.com/listing/3602048-312-parmley-ln-nashville-tn-37207/",
      "https://onwardre.com/home-search/listings/4324745903676553011-312-Parmley-Ln",
      "https://sherryerickson.com/listing-detail/1190000244/312-Parmley-Ln-Nashville-TN/",
      "https://www.homes.com/property/312-parmley-ln-nashville-tn/420rk7eepbtv4/",
      "https://www.era.com/property/detail/tn/nashville/312-parmley-ln/lid-P00800000HI3vjK5Sek2gpyNAGB7JUVtHZS7F86v",
      "https://www.exprealty.com/nashville-tn-real-estate/parmley-cove/312-parmley-ln",
      "https://www.woodmontrealty.com/property/12-3246933-312-parmley-ln-nashville-TN-37207",
      "https://angelapeach.com/home-search/listings/4324745903676553011-312-Parmley-Ln",
      "https://www.crye-leike.com/p/312-Parmley-Ln-Nashville-TN-37207/dmgid_189799850",
      "https://www.impactrealtytn.com/real-estate/312-parmley-ln-nashville-tn-37207/3602048/203983042",
      "https://www.realestatewins.net/newlisting/3602048/312-Parmley-Ln-Nashville-TN-37207",
      "https://www.realtysavingsllc.com/idx/listing/TN-REALTRACS/3602048/312-Parmley-Ln-Nashville-TN-37207",
      "https://risenashville.group/listing-detail/1190000244/312-Parmley-Ln-Nashville-TN",
      "https://www.tnrealestate.com/property-search/detail/38/3602048/312-parmley-ln-nashville-tn-37207/",
      "https://townecreekrealty.com/idx/mls-3602048-312_parmley_ln_nashville_tn_37207",
      "https://www.bhhs.com/homes-for-sale/tn/312-parmley-ln-nashville-37207/pid-434588014",
      "https://www.crye-leike.com/p/312-Parmley-Ln-Nashville-TN-37207/dmgsid_76702326",
      "https://www.nashvillesmls.com/listing-realtracs-vow/3246933-312-parmley-ln-nashville-tn-37207/",
      "https://www.redrealty.com/property/12-3246933-312-Parmley-Ln-Nashville-TN-37207",
      "https://benchmarkrealtytn.com/listing/3246933/312-parmley-lane-nashville-tn-37207/",
      "https://cannontown.com/listing-detail/1190000244/312-Parmley-Ln-Nashville-TN/",
      "https://choosecapstone.com/residential/rlt/3246933/312-parmley-ln-nashville-tn-37207",
      "https://www.impactrealtytn.com/real-estate/312-parmley-ln-nashville-tn-37207/3246933/198828081",
      "https://www.milesrealestateteam.com/homes/312-Parmley-Ln/Nashville/TN/37207/181603857/",
      "https://www.nashvillerealestate.com/listing/3246933-312-parmley-ln-nashville-tn-37207/",
      "https://richardfbryan.com/home-search/listings/4324745903676553011-312-Parmley-Ln?fr=1",
      "https://www.smithpropertypartners.com/search/tennessee/nashville/parmley-cove/312-parmley-ln-bid-51-3246933",
      "https://www.uppercumberlandlistings.com/property-search/detail/38/3246933/312-parmley-ln-nashville-tn-37207/?src=2"
    ]
  },
  {
    "address": "3114 SE Lincoln St, Portland, OR 97214",
    "expect": [
      "https://www.redfin.com/OR/Portland/3114-SE-Lincoln-St-97214/home/25772877",
      "https://www.zillow.com/homedetails/3114-SE-Lincoln-St-Portland-OR-97214/53958423_zpid/",
      "https://www.coldwellbankerhomes.com/or/portland/3114-se-lincoln-st/pid_72815754/"
    ],
    "confirmed": [
      "https://www.trulia.com/home/3114-se-lincoln-st-portland-or-97214-53958423",
      "https://www.realtor.com/realestateandhomes-detail/3114-SE-Lincoln-St_Portland_OR_97214_M17342-23418",
      "https://www.homes.com/property/3114-se-lincoln-st-portland-or/m4pb4hxt4y83c/",
      "https://www.compass.com/homedetails/3114-SE-Lincoln-St-Portland-OR-97214/1W580_pid/",
      "https://www.bhhsrep.com/realestate/details/130951537/3114-se-lincoln-st-portland-or-97214",
      "https://www.cascadehasson.com/realestate/details/130951537/3114-se-lincoln-street-portland-or-97214",
      "https://laurenrosehomes.com/homes/3114-se-lincoln-st-portland",
      "https://www.realtyofamerica.com/detail/OR/Portland/3114-Se-LINCOLN-St/59ee9f49-1859-45f0-b3c4-fafda95f6aea",
      "https://www.realtyportland.com/property-search/detail/53/131894435/3114-se-lincoln-st-portland-or-97214/",
      "https://www.weknowportland.com/property-search/detail/53/131894435/3114-se-lincoln-st-portland-or-97214/",
      "https://www.movoto.com/portland-or/3114-se-lincoln-st-portland-or-97214/pid_987bs1oilh/",
      "https://www.bhhs.com/homes-for-sale/or/3114-se-lincoln-st-portland-97214/pid-436647702",
      "https://www.exprealty.com/portland-or-real-estate/3114-se-lincoln-st",
      "https://listings.thekellygroup.com/idx/details/listing/b001/131894435",
      "https://www.goldnationequitygroup.com/property/65-131894435-3114-Se-Lincoln-St-Portland-OR-97214",
      "https://memeloggins.com/sold-listing/detail/1198764936/3114-SE-LINCOLN-ST-Portland-OR",
      "https://www.bhhsnw.com/realestate/details/130951537/3114-se-lincoln-st-portland-or-97214",
      "https://eugenespotlights.com/property/65-131894435-3114-Se-Lincoln-St-Portland-OR-97214/",
      "https://listings.becu.org/realestate/details/130951537/3114-se-lincoln-street-portland-or-97214",
      "https://www.pnwrealrealty.com/listing-detail/1186837487/3114-SE-LINCOLN-ST-Portland-OR",
      "https://www.portlandluxuryrealestate.com/property-search/detail/53/131894435/3114-se-lincoln-st-portland-or-97214/",
      "https://www.portlandrealestate.com/property-search/detail/53/131894435/3114-se-lincoln-st-portland-or-97214/",
      "https://sondernw.com/sold-listing/detail/1198764936/3114-SE-LINCOLN-ST-Portland-OR",
      "https://thisisfort.com/listing-detail/1186837487/3114-SE-LINCOLN-ST-Portland-OR",
      "https://www.windermere.com/listing/OR/Portland/3114-SE-Lincoln-St-97214/231341126",
      "https://thegmgroup.com/listing/rmls/131894435/Portland/3114-SE-LINCOLN-ST/"
    ]
  },
  {
    "address": "89 Montgomery St SE, Atlanta, GA 30317",
    "expect": [
      "https://www.redfin.com/GA/Atlanta/89-Montgomery-St-SE-30317/home/23692603",
      "https://homesbymarco.com/properties/89-montgomery-st-atlanta-ga-30317/1436273"
    ],
    "confirmed": [
      "https://www.coldwellbanker.com/ga/atlanta/89-montgomery-st-se/lid-P00800000HFdTm4XEDr5gmJKe3EZuICWRmYuXHQ8",
      "https://www.sweetmagnoliahomes.com/property/86-10825102-89-montgomery-street-se-atlanta-GA-30317",
      "https://www.zillow.com/homedetails/89-Montgomery-St-Atlanta-GA-30317/14467422_zpid/",
      "https://www.trulia.com/home/89-montgomery-st-atlanta-ga-30317-14467422",
      "https://www.realtor.com/realestateandhomes-detail/89-Montgomery-St-SE_Atlanta_GA_30317_M65665-52772",
      "https://www.compass.com/homedetails/89-Montgomery-St-SE-Atlanta-GA-30317/NR2C8_pid/",
      "https://www.coldwellbankerhomes.com/ga/atlanta/89-montgomery-street-se/pid_73043229/",
      "https://www.bhgre.com/home/detail/ga/atlanta/89-montgomery-st-se/lid-P00800000HFdTm4XEDr5gmJKe3EZuICWRmYuXHQ8",
      "https://www.annakintown.com/search/georgia/atlanta/edgewood/89-montgomery-st-se-bid-22-10825102",
      "https://beckycrawford.bhhsgeorgia.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317/10701721",
      "https://ivyleaguerealtyga.lofty.me/listing-detail/1187540123/89-Montgomery-ST-SE-Atlanta-GA",
      "https://www.omegahome.com/idx/listing/GeorgiaMLS/10825102/89-montgomery-st-se-georgiamls-10825102/",
      "https://pamsantoro.bhhsgeorgia.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317/10701721",
      "https://www.sixbricksrealty.com/sold-listing/detail/1198833115/89-Montgomery-ST-SE-Atlanta-GA",
      "https://summitatgateway.harrynorman.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317/10701721",
      "https://www.homes.com/property/89-montgomery-st-se-atlanta-ga/7jm1fsgpjvt5s/",
      "https://www.movoto.com/atlanta-ga/89-montgomery-st-se-atlanta-ga-30317/pid_l4xffhvlbh/active/",
      "https://www.estately.com/listings/info/89-montgomery-street-se-atlanta-ga-30317--2",
      "https://www.exprealty.com/atlanta-ga-real-estate/edgewood/89-montgomery-st-se",
      "https://www.archerhometeam.com/property/86-10825102-89-montgomery-street-se-atlanta-GA-30317",
      "https://www.metroatlantahomesales.com/property/86-10825102-89-montgomery-street-se-atlanta-GA-30317",
      "https://www.bktgeorgia.com/search/georgia/atlanta/edgewood/89-montgomery-st-se-bid-22-10825102",
      "https://www.georgiamls.com/89-montgomery-street-se-atlanta-ga-30317/10825102",
      "https://www.hankbailey.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317/5738685",
      "https://www.harrynorman.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317",
      "https://jeanineblumer.bhhsgeorgia.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317/10825102",
      "https://lizperez.harrynorman.com/realestate/details/20633986/89-montgomery-street-se-atlanta-ga-30317/5738685",
      "https://www.realestateofatlanta.com/property/86-10825102-89-montgomery-street-se-atlanta-GA-30317",
      "https://www.realpha.com/property/89-montgomery-st-se-atlanta-ga-30317/9039644002207028124",
      "https://www.realtracs.com/listings/7467611/address/89-montgomery-street-se-atlanta-ga-30317",
      "https://www.seaglass.com/property/89-montgomery-st-se-atlanta-ga-30317/430756/",
      "https://www.coldwellbankerhomes.com/ga/atlanta/89-montgomery-street-se/pid_73041492/",
      "https://homefinder.com/realestateandhomes-detail/89-Montgomery-St-SE_Atlanta_GA_30317_M65665-52772",
      "https://krissellsga.com/listing-detail/1187533084/89-Montgomery-ST-SE-Atlanta-GA"
    ]
  },
  {
    "address": "2727 W 43rd St #402, Minneapolis, MN 55410",
    "expect": [
      "https://www.redfin.com/MN/Minneapolis/2727-W-43rd-St-55410/unit-402/home/49888403",
      "https://www.zillow.com/homedetails/445846157_zpid/"
    ],
    "confirmed": [
      "https://www.realtor.com/realestateandhomes-detail/2727-W-43rd-St-Apt-402_Minneapolis_MN_55410_M78814-86194",
      "https://www.movoto.com/minneapolis-mn/2727-w-43rd-st-402-minneapolis-mn-55410/pid_awjggg2jgh/",
      "https://www.coldwellbankerhomes.com/mn/minneapolis/2727-w-43rd-st-402/pid_74142023/",
      "https://www.exitnorthstarrealty.com/sold-listing/detail/1068755727/2727-W-43rd-ST-402-Minneapolis-MN",
      "https://fergusonrealty.net/sold-listing/detail/1200031527/2727-W-43rd-ST-402-Minneapolis-MN"
    ]
  },
  {
    "address": "40 E 9th St #616, Chicago, IL 60605",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.trulia.com/home/40-e-9th-st-616-chicago-il-60605-70471540",
      "https://www.compass.com/homedetails/40-E-9th-St-Unit-616-Chicago-IL-60605/1WG5FT_pid",
      "https://www.bhgre.com/home/detail/il/chicago/40-e-9th-st-apt-616/lid-P00800000H5C3Jy6CqYOFHbFryKDotOxNYpin5eC",
      "https://www.coldwellbankerhomes.com/il/chicago/40-e-9th-st-616/pid_69316148",
      "https://www.homes.com/property/40-e-9th-st-chicago-il-unit-616/e019vfn7fyn8z/",
      "https://www.atproperties.com/12539098/40-e-9th-street-616-chicago-illinois-60605-nei",
      "https://www.dreamtown.com/properties/12539098/40-e-9th-street-616",
      "https://www.hellocondo.com/chicago-il/40-e-9th-st-unit-616-chicago-il-60605"
    ]
  },
  {
    "address": "114 N 84th St, Seattle, WA 98103",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.zillow.com/homedetails/114-N-84th-St-Seattle-WA-98103/48836185_zpid",
      "https://www.trulia.com/home/114-n-84th-st-seattle-wa-98103-48836185",
      "https://www.bhgre.com/home/detail/wa/seattle/114-n-84th-st/lid-P00800000HAYxUDuwf4qnpmz3iiO3pbOhr4NxoBW",
      "https://inservice.exprealty.com/seattle-wa-real-estate/114-n-84th-st",
      "https://jonathanpearlstein.evrealestate.com/listing-detail/1181826784/114-N-84th-ST-Seattle-WA",
      "https://everydoorrealestate.com/listing/nwmls/2518448/Seattle/114-N-84th-Street/",
      "https://bestinwest.roveridx.com/wa/seattle/greenwood/114-n-84th-street/"
    ]
  },
  {
    "address": "184 Danyow Rd, Sheldon, VT 05483",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.zillow.com/homedetails/184-Danyow-Rd-Sheldon-VT-05483/75433354_zpid",
      "https://www.compass.com/homedetails/184-Danyow-Rd-Sheldon-VT-05450/5B456_pid",
      "https://www.raveis.com/prop/5074739/184-danyow-road-sheldon-vt-05450",
      "https://www.homefront.com/homes/vt/sheldon/property/184-danyow-road-decc66aa-e057-3440-b3ca-e632b2fa291d",
      "https://www.hickokandboardman.com/real-estate/sheldon/184-danyow-road/5074739.html",
      "https://www.hickokandboardman.com/real-estate/sheldon/184-danyow-road/4928813.html",
      "https://www.hickokandboardman.com/real-estate/sheldon/184-danyow-road/4656898.html"
    ]
  },
  {
    "address": "921 Court Way, San Diego, CA 92103",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.century21.com/homes/detail/ca/san-diego/921-court-way/lid-P00800000H7KbEr0rhUrSmYI5u5tbHeOsWaTa0yb",
      "https://svpremier.com/real-estate-search/listing/SanDiego/260005258/San-Diego/921-Court-Way",
      "https://cardozasellssd.com/home-search/listings/4413529080815351256-921-Court-Way"
    ]
  },
  {
    "address": "1963 Hydrangea Pl, Las Vegas, NV 89106",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.trulia.com/home/1963-hydrangea-pl-las-vegas-nv-89106-460698723",
      "https://www.century21.com/homes/detail/nv/las-vegas/1963-hydrangea-pl/lid-P00800000H8VyteKdYSpNhX3Y8Iv3exYYwNtaHiu",
      "https://www.zoocasa.com/las-vegas-nv-real-estate/1963-hydrangea-pl",
      "https://ziffy.ai/listings/1963-hydrangea-pl-las-vegas-nv-89106-82979229"
    ]
  },
  {
    "address": "1727 Huy Rd, Columbus, OH 43224",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.zillow.com/homedetails/1727-Huy-Rd-Columbus-OH-43224/34026613_zpid",
      "https://www.coldwellbanker.com/oh/columbus/1727-huy-rd/lid-P00800000HAvSNjar9NkTId9VgWPA5gRQXZevtoT",
      "https://www.howardhanna.com/property/1727-huy-road-columbus-oh-43224-390003777463",
      "https://ziffy.ai/listings/1727-huy-rd-columbus-oh-43224-88190082"
    ]
  },
  {
    "address": "301 Latimer Rd, Raleigh, NC 27609",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.trulia.com/home/301-latimer-rd-raleigh-nc-27609-6379455",
      "https://www.coldwellbankerhomes.com/nc/raleigh/301-latimer-rd/pid_68021167",
      "https://www.jimallen.com/homes/301-Latimer-Road-Raleigh-NC-27609/11de29bbdaee9fe9e0c76d99db01ab3e",
      "https://martihampton.com/listing/triangle/10128076/Raleigh/301-Latimer-Road",
      "https://raleighrealty.com/home/301-latimer-rd-raleigh-nc-27609-10128076",
      "https://diamondrealtyburlington.homefront.com/homes/nc/raleigh/property/301-latimer-road-5e484432-0afa-3cfe-8fbb-149b3c105ff1",
      "https://www.forrent.com/nc/raleigh/301-latimer-rd/nfqd3cm",
      "https://www.apartmentlist.com/nc/raleigh/301-latimer-road"
    ]
  },
  {
    "address": "601 E 81st Ter, Kansas City, MO 64131",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.trulia.com/home/601-e-81st-ter-kansas-city-mo-64131-2425500",
      "https://www.coldwellbanker.com/mo/kansas-city/601-east-81st-terrace/lid-P00800000GvlItZjBpYbcgkmJzV6Hn8EtDmmiXAR"
    ]
  },
  {
    "address": "12 Maple Ave #1, Somerville, MA 02145",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.homes.com/property/12-maple-ave-somerville-ma-unit-1/f3pcp88yl63s2",
      "https://estately.com/listings/info/12-maple-avenue-somerville-ma-02145",
      "https://raveis.com/prop/73349081/12-maple-avenue-somerville-ma-02145",
      "https://dawnhadley.evrealestate.com/listing-detail/1159681525/12_Maple_Avenue_-1-Somerville-MA",
      "https://nicolescatalano.evrealestate.com/listing-detail/1159681525/12_Maple_Avenue_-1-Somerville-MA",
      "https://buyowner.com/homes/12-maple-avenue-ma-02145-73349081"
    ]
  },
  {
    "address": "727 E 25th St, Houston, TX 77008",
    "set": "B",
    "expect": [],
    "confirmed": [
      "https://www.homes.com/property/727-e-25th-st-houston-tx/62d130rtt02k2",
      "https://www.coldwellbankerhomes.com/tx/houston/727-e-25th-st/pid_70312172",
      "https://homes.houstonproperties.com/tx/heightsgreater-heights/home/727-e-25th-street-houston-77008-83344460",
      "https://homes.houstonproperties.com/tx/heightsgreater-heights/home/727-e-25th-street-houston-77008-71815208"
    ]
  }
];

function pathKey(u: string): string {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, '') + x.pathname).toLowerCase().replace(/\/$/, '');
  } catch {
    return u;
  }
}

// Sites that are one company's two front doors: a page on either counts for both.
const SAME_SITE: Record<string, string> = { coldwellbanker: 'coldwellbanker', homefinder: 'realtor' };

/** Which big sites the home is known to be on, and which of those the scan found (any page on that site). */
export function siteCoverage(namedUrls: string[], foundKeys: string[]): { sitesExpected: number; sitesFound: number; sitesMissed: string[] } {
  const key = (k: string | undefined) => (k ? SAME_SITE[k] ?? k : '');
  const want = [...new Set(namedUrls.map((u) => key(siteFor(u)?.key)).filter(Boolean))];
  const got = new Set(foundKeys.map(key));
  const missed = want.filter((k) => !got.has(k));
  return { sitesExpected: want.length, sitesFound: want.length - missed.length, sitesMissed: missed };
}

/** Every search a scan made and what came back, so a run can be replayed offline without search credits. */
export interface RawSearch {
  q: SearchQuery;
  rows: { url: string; title: string; snippet: string; thumbnail?: string }[];
  error?: string;
}
export interface RawHome {
  address: string;
  searches: RawSearch[];
  lookups: { key: string; rows: Candidate[]; error?: string }[];
}

export interface SelftestRow {
  address: string;
  set: 'A' | 'B';
  /** Pages in this home's list (original + confirmed). */
  expected: number;
  found: number;
  missed: string[];
  /** The original hand-collected list only. */
  origExpected: number;
  origFound: number;
  /** Named sites only (see isNamedSite). */
  namedExpected: number;
  namedFound: number;
  namedMissed: string[];
  /** Big sites (one per site, any of its pages counts): did we find the home on each site it's known to be on? */
  sitesExpected: number;
  sitesFound: number;
  sitesMissed: string[];
  /** Each search: "label[sites]=results", to see which searches came back empty. */
  searches: string[];
  total: number;
  lookups: { key: string; ok: boolean; found: number; error?: string }[];
  queryErrors: number;
  /** First search error, e.g. "auth: HTTP 403 Unauthorized", to diagnose failed searches. */
  firstError?: string;
  /** Results that aren't in the list, as "confidence | found via | url", to spot junk or new real pages. */
  extras: string[];
  /** Exact-match results that aren't in the list yet: candidates to add after a look. */
  newExact: number;
  /** How searches ran: "full" (site:/OR allowed) or the simpler fallback. */
  searchMode?: string;
  /** Results with an exact address match, known or not. */
  exact: number;
  /** Exact matches by photo check: photos seen, no photos seen, couldn't check. */
  photos: { seen: number; none: number; unknown: number };
  ms: number;
}

export interface SelftestResult {
  rows: SelftestRow[];
  /** Headline: share of the page list found. */
  expected: number;
  found: number;
  pct: number;
  /** The original 43-page list, kept for comparison with earlier runs. */
  origExpected: number;
  origFound: number;
  origPct: number;
  /** Headline: named sites (portals, brand brokerages, social, video) found. */
  namedExpected: number;
  namedFound: number;
  namedPct: number;
  /** Headline from Nov 19 (late): big sites covered, one per site per home. */
  sitesExpected: number;
  sitesFound: number;
  sitesPct: number;
  exactPages: number;
  newExact: number;
  photos: { seen: number; none: number; unknown: number };
  searchMode?: string;
  /** The first 10 homes only, to compare with runs before set B was added. */
  setA?: { sitesExpected: number; sitesFound: number; sitesPct: number; namedPct: number };
  /** Raw searches per home, for offline replay. */
  raw?: RawHome[];
}

/** Wrap a provider and lookups so every search and its results are kept. */
export function recorder(opts: EngineOptions, address: string): { opts: EngineOptions; raw: RawHome } {
  const raw: RawHome = { address, searches: [], lookups: [] };
  const clip = (c: Candidate) => ({ url: c.url, title: (c.title ?? '').slice(0, 200), snippet: (c.snippet ?? '').slice(0, 300), ...(c.thumbnail ? { thumbnail: c.thumbnail } : {}) });
  const p = opts.provider;
  const provider: SearchProvider | null = p && {
    name: p.name,
    mode: p.mode?.bind(p),
    async search(q, signal) {
      try {
        const rows = await p.search(q, signal);
        raw.searches.push({ q, rows: rows.map(clip) });
        return rows;
      } catch (e) {
        raw.searches.push({ q, rows: [], error: String((e as Error)?.message ?? e).slice(0, 200) });
        throw e;
      }
    },
  };
  const lookups: PortalLookup[] | undefined = opts.lookups?.map((l) => ({
    key: l.key,
    async run(line, fetchFn, signal) {
      try {
        const rows = await l.run(line, fetchFn, signal);
        raw.lookups.push({ key: l.key, rows });
        return rows;
      } catch (e) {
        raw.lookups.push({ key: l.key, rows: [], error: String((e as Error)?.message ?? e).slice(0, 200) });
        throw e;
      }
    },
  }));
  return { opts: { ...opts, provider, ...(lookups ? { lookups } : {}) }, raw };
}

/** The same query asked again gets the same saved answer. */
export function queryKey(q: SearchQuery): string {
  return JSON.stringify([q.label, q.kind, q.phrases, q.extra ?? '', q.sites ?? [], q.exclude ?? [], q.page ?? 1, q.num ?? 0]);
}

/** Replay a saved run offline: searches answer from the file (unknown searches get nothing), no credits used. */
export function replayEngine(raw: RawHome): EngineOptions & { misses: string[] } {
  const byKey = new Map(raw.searches.map((s) => [queryKey(s.q), s]));
  const misses: string[] = [];
  return {
    misses,
    provider: {
      name: 'replay',
      mode: () => 'full',
      async search(q) {
        const hit = byKey.get(queryKey(q));
        if (!hit) { misses.push(queryKey(q)); return []; }
        if (hit.error) throw new Error(hit.error);
        return hit.rows.map((r) => ({ ...r, via: `${q.kind === 'web' ? 'search' : q.kind}:${q.label}` }));
      },
    },
    lookups: raw.lookups.map((l) => ({ key: l.key, async run() { if (l.error) throw new Error(l.error); return l.rows; } })),
  };
}

export async function runSelftest(
  engine: () => EngineOptions,
  opts: { concurrency?: number; homes?: typeof SELFTEST_HOMES; record?: boolean } = {},
): Promise<SelftestResult> {
  const concurrency = opts.concurrency ?? 3;
  const rows: SelftestRow[] = [];
  const raws: RawHome[] = [];
  const queue = [...(opts.homes ?? SELFTEST_HOMES)];
  const zpid = (u: string) => u.match(/(\d+)_zpid/)?.[1];
  const worker = async () => {
    for (let h = queue.shift(); h; h = queue.shift()) {
      const rec = opts.record ? recorder(engine(), h.address) : null;
      if (rec) raws.push(rec.raw);
      const r = await runScan(parseAddress(h.address), rec ? rec.opts : engine());
      const got = new Set(r.findings.map((f) => pathKey(f.url)));
      const zpidGot = new Set(r.findings.filter((f) => f.siteKey === 'zillow').map((f) => zpid(f.url)));
      const hit = (u: string) => (zpid(u) ? zpidGot.has(zpid(u)) : got.has(pathKey(u)));
      const list = [...h.expect, ...(h.confirmed ?? [])];
      const missed = list.filter((u) => !hit(u));
      const known = new Set(list.map(pathKey));
      const knownZ = new Set(list.map(zpid).filter(Boolean));
      const isNew = (u: string) => !known.has(pathKey(u)) && !knownZ.has(zpid(u));
      const extras = r.findings
        .filter((f) => isNew(f.url))
        .map((f) => `${f.confidence} | ${f.foundVia?.[0] ?? ''} | ${f.photos ?? ''} | ${f.url}`)
        .slice(0, 60);
      rows.push({
        address: h.address, set: h.set ?? 'A', expected: list.length, found: list.length - missed.length, missed,
        origExpected: h.expect.length, origFound: h.expect.filter(hit).length, total: r.findings.length,
        namedExpected: list.filter(isNamedSite).length, namedFound: list.filter((u) => isNamedSite(u) && hit(u)).length,
        namedMissed: missed.filter(isNamedSite),
        ...siteCoverage(list.filter(isNamedSite), r.findings.map((f) => f.siteKey)),
        searches: (r.diagnostics.perQuery ?? []).filter((q) => q.sites).map((q) => `${q.label}[${q.sites}]=${q.n}`),
        extras, newExact: r.findings.filter((f) => f.confidence === 'exact' && isNew(f.url)).length,
        searchMode: r.diagnostics.searchMode, exact: r.findings.filter((f) => f.confidence === 'exact').length,
        photos: (['seen', 'none', 'unknown'] as const).reduce((o, k) => ({ ...o, [k]: r.findings.filter((f) => f.confidence === 'exact' && (f.photos ?? 'unknown') === k).length }), { seen: 0, none: 0, unknown: 0 }),
        lookups: r.diagnostics.lookups, queryErrors: r.diagnostics.queryErrors.length, ms: r.diagnostics.durationMs,
        firstError: r.diagnostics.queryErrors[0] ? `${r.diagnostics.queryErrors[0].code}: ${r.diagnostics.queryErrors[0].detail ?? ''}`.trim() : undefined,
      });
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { ...summarize(rows), ...(opts.record ? { raw: raws.sort((a, b) => a.address.localeCompare(b.address)) } : {}) };
}

/** Totals for a set of rows. Exported so the page can merge the two halves of a run. */
export function summarize(rowsIn: SelftestRow[]): SelftestResult {
  const rows = [...rowsIn].sort((a, b) => a.address.localeCompare(b.address));
  const sum = (k: keyof SelftestRow) => rows.reduce((s, r) => s + (r[k] as number), 0);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const expected = sum('expected'), found = sum('found'), origExpected = sum('origExpected'), origFound = sum('origFound');
  const namedExpected = sum('namedExpected'), namedFound = sum('namedFound');
  const sitesExpected = sum('sitesExpected'), sitesFound = sum('sitesFound');
  return {
    rows, expected, found, pct: pct(found, expected), origExpected, origFound, origPct: pct(origFound, origExpected),
    namedExpected, namedFound, namedPct: pct(namedFound, namedExpected),
    sitesExpected, sitesFound, sitesPct: pct(sitesFound, sitesExpected),
    exactPages: sum('exact'), newExact: sum('newExact'),
    setA: (() => {
      const a = rows.filter((r) => r.set === 'A');
      const e = a.reduce((s, r) => s + r.sitesExpected, 0), f = a.reduce((s, r) => s + r.sitesFound, 0);
      const ne = a.reduce((s, r) => s + r.namedExpected, 0), nf = a.reduce((s, r) => s + r.namedFound, 0);
      return { sitesExpected: e, sitesFound: f, sitesPct: pct(f, e), namedPct: pct(nf, ne) };
    })(),
    photos: { seen: rows.reduce((s, r) => s + r.photos.seen, 0), none: rows.reduce((s, r) => s + r.photos.none, 0), unknown: rows.reduce((s, r) => s + r.photos.unknown, 0) }, searchMode: rows.map((r) => r.searchMode).filter(Boolean).pop(),
  };
}
