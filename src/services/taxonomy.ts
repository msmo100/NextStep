// Taxonomy concept IDs from the JobTech Taxonomy API (taxonomy.api.jobtechdev.se).
// Used as filter values for the JobSearch API (jobsearch.api.jobtechdev.se).

export interface TaxonomyOption {
  id: string;
  label: string;
}

// type=occupation-field
export const OCCUPATION_FIELDS: TaxonomyOption[] = [
  { id: 'X82t_awd_Qyc', label: 'Administration, ekonomi, juridik' },
  { id: 'j7Cq_ZJe_GkT', label: 'Bygg och anläggning' },
  { id: 'bh3H_Y3h_5eD', label: 'Chefer och verksamhetsledare' },
  { id: 'apaJ_2ja_LuF', label: 'Data/IT' },
  { id: 'RPTn_bxG_ExZ', label: 'Försäljning, inköp, marknadsföring' },
  { id: 'PaxQ_o1G_wWH', label: 'Hantverk' },
  { id: 'ScKy_FHB_7wT', label: 'Hotell, restaurang, storhushåll' },
  { id: 'NYW6_mP6_vwf', label: 'Hälso- och sjukvård' },
  { id: 'wTEr_CBC_bqh', label: 'Industriell tillverkning' },
  { id: 'yhCP_AqT_tns', label: 'Installation, drift, underhåll' },
  { id: 'Uuf1_GMh_Uvw', label: 'Kropps- och skönhetsvård' },
  { id: '9puE_nYg_crq', label: 'Kultur, media, design' },
  { id: 'bH5L_uXD_ZAX', label: 'Militära yrken' },
  { id: 'VuuL_7CH_adj', label: 'Naturbruk' },
  { id: 'kJeN_wmw_9wX', label: 'Naturvetenskap' },
  { id: 'MVqp_eS8_kDZ', label: 'Pedagogik' },
  { id: 'whao_Q6A_ScE', label: 'Sanering och renhållning' },
  { id: 'E7hm_BLq_fqZ', label: 'Säkerhet och bevakning' },
  { id: 'ASGV_zcE_bWf', label: 'Transport, distribution, lager' },
  { id: 'GazW_2TU_kJw', label: 'Yrken med social inriktning' },
  { id: '6Hq3_tKo_V57', label: 'Yrken med teknisk inriktning' },
];

// type=employment-type
export const EMPLOYMENT_TYPES: TaxonomyOption[] = [
  { id: 'kpPX_CNN_gDU', label: 'Tillsvidareanställning' },
  { id: 'sTu5_NBQ_udq', label: 'Tidsbegränsad anställning' },
  { id: 'gro4_cWF_6D7', label: 'Vikariat' },
  { id: '1paU_aCR_nGn', label: 'Behovsanställning' },
  { id: 'EBhX_Qm2_8eX', label: 'Säsongsanställning' },
];

// type=region — the 21 Swedish counties (län)
export const REGIONS: TaxonomyOption[] = [
  { id: 'DQZd_uYs_oKb', label: 'Blekinge län' },
  { id: 'oDpK_oZ2_WYt', label: 'Dalarnas län' },
  { id: 'K8iD_VQv_2BA', label: 'Gotlands län' },
  { id: 'zupA_8Nt_xcD', label: 'Gävleborgs län' },
  { id: 'wjee_qH2_yb6', label: 'Hallands län' },
  { id: '65Ms_7r1_RTG', label: 'Jämtlands län' },
  { id: 'MtbE_xWT_eMi', label: 'Jönköpings län' },
  { id: '9QUH_2bb_6Np', label: 'Kalmar län' },
  { id: 'tF3y_MF9_h5G', label: 'Kronobergs län' },
  { id: '9hXe_F4g_eTG', label: 'Norrbottens län' },
  { id: 'CaRE_1nn_cSU', label: 'Skåne län' },
  { id: 'CifL_Rzy_Mku', label: 'Stockholms län' },
  { id: 's93u_BEb_sx2', label: 'Södermanlands län' },
  { id: 'zBon_eET_fFU', label: 'Uppsala län' },
  { id: 'EVVp_h6U_GSZ', label: 'Värmlands län' },
  { id: 'g5Tt_CAV_zBd', label: 'Västerbottens län' },
  { id: 'NvUF_SP1_1zo', label: 'Västernorrlands län' },
  { id: 'G6DV_fKE_Viz', label: 'Västmanlands län' },
  { id: 'zdoY_6u5_Krt', label: 'Västra Götalands län' },
  { id: 'xTCk_nT5_Zjm', label: 'Örebro län' },
  { id: 'oLT3_Q9p_3nn', label: 'Östergötlands län' },
];

const ALL_OPTIONS = [...OCCUPATION_FIELDS, ...EMPLOYMENT_TYPES, ...REGIONS];

export function labelForId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return ALL_OPTIONS.find((o) => o.id === id)?.label;
}
