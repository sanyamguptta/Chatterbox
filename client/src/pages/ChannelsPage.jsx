import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import ChannelList from '../components/channels/ChannelList';
import ChatWindow from '../components/channels/ChatWindow';
import api from '../api/axios';
import styles from './ChannelsPage.module.scss';

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/channels');
        setChannels(res.data.channels);
        if (res.data.channels.length > 0) {
          setSelected(res.data.channels[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <Layout>
      <div className={styles.loading}>Loading channels…</div>
    </Layout>
  );

  return (
    <Layout>
      <h1 className={styles.heading}>Discussion Channels</h1>
      <div className={styles.layout}>
        <ChannelList
          channels={channels}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
        <div className={styles.chat}>
          <ChatWindow channel={selected} />
        </div>
      </div>
    </Layout>
  );
}
