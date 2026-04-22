declare module 'react-select-country-list' {
  export type CountryOption = {
    value: string
    label: string
  }

  type CountryListApi = {
    getData: () => CountryOption[]
  }

  export default function countryList(): CountryListApi
}
