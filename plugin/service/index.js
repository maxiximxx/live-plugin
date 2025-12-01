import { baseFetch } from '../wx-utils/fetch/index'

export const getUserInfoAndValid = async (data) => {
  const res = await baseFetch.get({
    url: '/live/api/v1/class/getUserInfoAndValid',
    data,
  })
  return res.data
}

export const joinClass = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/v1/class/joinClass',
    data,
  })
  return res.data
}

export const getSdkParam = async (data) => {
  const res = await baseFetch.get({
    url: '/live/api/liveRooms/sdk/param',
    data,
  })
  return res.data
}

export const getClass = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/v1/class/get',
    data,
  })
  return res.data
}

export const getLiveRoomDetail = async (id) => {
  const res = await baseFetch.get({
    url: `/live/api/liveRooms/${id}`,
  })
  return res.data
}
