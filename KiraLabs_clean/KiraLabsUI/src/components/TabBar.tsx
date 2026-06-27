// src/components/TabBar.tsx
// Tab HOME / VIRTUAL TRY-ON / FOR YOU
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TabName = 'home' | 'tryOn' | 'forYou';

type Props = {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
};

const tabs: {key: TabName; label: string}[] = [
  {key: 'home', label: 'HOME'},
  {key: 'tryOn', label: 'VIRTUAL TRY-ON'},
  {key: 'forYou', label: 'FOR YOU'},
];

const TabBar: React.FC<Props> = ({activeTab, onTabChange}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  const activeIndex = useMemo(() => {
    const index = tabs.findIndex(tab => tab.key === activeTab);
    return index >= 0 ? index : 0;
  }, [activeTab]);

  const tabWidth = containerWidth / tabs.length;
  const indicatorWidth = tabWidth * 0.6;
  const indicatorLeftOffset = tabWidth * 0.2;

  useEffect(() => {
    if (!containerWidth) {
      return;
    }

    Animated.timing(indicatorX, {
      toValue: activeIndex * tabWidth + indicatorLeftOffset,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, containerWidth, indicatorLeftOffset, indicatorX, tabWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            activeOpacity={0.75}
            onPress={() => onTabChange(tab.key)}>
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {containerWidth > 0 ? (
        <Animated.View
          style={[
            styles.underline,
            {
              width: indicatorWidth,
              left: indicatorX,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    position: 'relative',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },

  tabText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  tabTextActive: {
    color: '#1A1A1A',
  },

  underline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#2B5CE6',
  },
});

export default TabBar;
