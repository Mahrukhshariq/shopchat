import { useState, useEffect } from 'react';
import { getSocket } from '../utils/socket';

const useOnlineStatus = (uids = []) => {
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket || uids.length === 0) return;

    // Request current statuses
    socket.emit('user:getStatus', { uids });

    const onStatusList = (statuses) => {
      const map = {};
      statuses.forEach(({ uid, isOnline }) => { map[uid] = isOnline; });
      setStatusMap((prev) => ({ ...prev, ...map }));
    };

    const onStatus = ({ uid, isOnline }) => {
      if (uids.includes(uid)) {
        setStatusMap((prev) => ({ ...prev, [uid]: isOnline }));
      }
    };

    socket.on('user:statusList', onStatusList);
    socket.on('user:status', onStatus);

    return () => {
      socket.off('user:statusList', onStatusList);
      socket.off('user:status', onStatus);
    };
  }, [uids.join(',')]); // eslint-disable-line

  return statusMap;
};

export default useOnlineStatus;
