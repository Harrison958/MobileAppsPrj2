import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import country from 'country-list-js';

const API_URL = 'http://localhost:3000';
const DEFPROFILE = {
  id: '',
  name: '',
  phone: '',
  department: '',
  address: { street: '', city: '', state: '', zip: '', country: '' }
};

const DEFCONTEXT = {
  // font sizes
  fs1: 18,
  fs2: 16,
  fs3: 14,
  // font size scaling
  fss: 100,
  // font weights
  fw1: 'bold',
  fw2: '600',
  fw3: '500',
  // colors
  c1: '#FFFFFF', // white
  c2: '#F5F5F5', // off white
  c3: '#000000', // black
  c4: '#333333', // dark gray
  c5: '#777777', // gray
  c6: '#AAAAAA', // light gray
  c7: '#007BFF', // blue
  c8: '#FF6347', // red
  c9: '#28a745', // green
};

// department id = index
const DEPARTMENTS = [
  "General",
  "Information Communications Technology",
  "Finance",
  "Marketing",
  "Human Resources"
];

const COUNTRIES = country.names().sort();
COUNTRIES.unshift("(None)");

//-------------//
// HOME SCREEN //
//-------------//

const HomeScreen = ({ navigation }) => {
  const { data, setData } = useContext(Context);
  const [profiles, setProfiles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchProfiles = () => {
    fetch(`${API_URL}/profiles`)
      .then(res => res.json())
      .then(setProfiles)
      .catch(console.error);
  };
  
  useEffect(() => {
    fetchProfiles();
    setData({ ...data, refresh: fetchProfiles });
  }, []);
  
  return (
    <View style={styles(data).pageContainer}>
      <FlatList
        data={profiles}
        renderItem={({ item }) => 
          <ProfileCard
            key={item.id}
            profile={item}
            onPress={() => navigation.navigate('Update', {
              id: item.id,
              isNew: false,
            })}
            onDelete={() => { setSelectedId(item.id); setModalVisible(true); }}
            data={data}
          />
        }
        keyExtractor={item => item.id}
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('Add', { isNew: true })}
            style={homeStyles(data).addProfileBtn}>
            <Text style={homeStyles(data).addProfileText}>Add Profile</Text>
          </TouchableOpacity>
        }
      />
      <ConfirmationModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={() => {
          fetch(`${API_URL}/profile/${selectedId}`, { method: 'DELETE' })
            .then(fetchProfiles)
            .catch(console.error);
          setModalVisible(false);
          setSelectedId(null);
        }}
        message="Are you sure you want to delete this profile?"
        data={data}
      />
    </View>
  );
};

const ProfileCard = ({ profile, onPress, onDelete, data }) => (
  <TouchableOpacity onPress={onPress} style={homeStyles(data).profileCard}>
    <Text style={homeStyles(data).profileName}>{profile.name}</Text>
    <TouchableOpacity onPress={onDelete} style={homeStyles(data).deleteBtn}>
      <Text style={homeStyles(data).deleteText}>Delete</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const homeStyles = (data) => StyleSheet.create({
  profileCard: {
    marginVertical: 6,
    padding: 16,
    backgroundColor: data.c1,
    borderRadius: 10,
    shadowColor: data.c3,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: data.fs1,
    fontWeight: data.fw2,
    color: data.c4,
  },
  profileContent: {
    fontSize: data.fs3,
    color: data.c5,
    marginTop: 8,
  },
  addProfileBtn: {
    backgroundColor: data.c7,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: data.c7,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  addProfileText: {
    color: data.c1,
    fontWeight: data.fw1,
    fontSize: data.fs2,
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: data.c8,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  deleteText: {
    color: data.c1,
    fontWeight: data.fw2,
    fontSize: data.fs3,
  },
});

//----------------//
// PROFILE SCREEN //
//----------------//

const ProfileScreen = ({ route, navigation }) => {
  const { data, setData } = useContext(Context);
  const [profile, setProfile] = useState(DEFPROFILE);
  const savedRef = useRef(true);

  const { modalVisible, cancel, confirm } = ((savedRef, navigation) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [navEvent, setNavEvent] = useState(null);

    useFocusEffect(() =>
      navigation.addListener('beforeRemove', e => {
        if (savedRef.current) return;
        e.preventDefault();
        setNavEvent(e);
        setModalVisible(true);
      })
    );

    const cancel = () => setModalVisible(false);
    const confirm = () => {
      setModalVisible(false);
      if (navEvent) {
        data.refresh();
        navigation.dispatch(navEvent.data.action);
        setNavEvent(null);
      }
    };

    return { modalVisible, cancel, confirm };
  })(savedRef, navigation);

  useFocusEffect(() => {
    if (profile !== DEFPROFILE) return;
    if (!route.params.isNew) {
      fetch(`${API_URL}/profile/${route.params.id}`)
        .then(res => res.json())
        .then(setProfile)
        .catch(console.error);
    }
  });

  return (
    <>
      <ProfileForm
        profile={profile}
        setProfile={(newProfile) => {
          setProfile(newProfile);
          savedRef.current = false;
        }}
        onSubmit={() => {
          fetch(`${API_URL}/profile${route.params.isNew ? '' : `/${route.params.id}`}`, {
            method: route.params.isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
          })
          .then(() => {
            data.refresh();
            savedRef.current = true;
            navigation.goBack();
          })
          .catch(console.error);
        }}
        data={data}
        isnew={route.params.isNew}
      />
      <ConfirmationModal
        visible={modalVisible}
        onCancel={cancel}
        onConfirm={confirm}
        message="You have unsaved changes. Are you sure you want to leave?"
        data={data}
      />
    </>
  );
};

const ProfileForm = ({ profile, setProfile, onSubmit, data, isnew }) => {
  const fields = [
    { type: 'header', title: 'Personal Info' },
    { type: 'field', label: 'Name:', value: profile.name, key: 'name' },
    { type: 'field', label: 'Phone:', value: profile.phone, key: 'phone' },
    { type: 'dropdown', label: 'Department:', value: profile.department, key: 'department',
      options: DEPARTMENTS, useIndexVal: true },
    { type: 'header', title: 'Address' },
    { type: 'field', label: 'Street:', value: profile.address?.street, key: 'address.street' },
    { type: 'field', label: 'City:', value: profile.address?.city, key: 'address.city' },
    { type: 'field', label: 'State:', value: profile.address?.state, key: 'address.state' },
    { type: 'field', label: 'Zip:', value: profile.address?.zip, key: 'address.zip' },
    { type: 'dropdown', label: 'Country:', value: profile.address?.country, key: 'address.country',
      options: COUNTRIES, useIndexVal: false },
  ];

  return (
    <View style={styles(data).pageContainer}>
      <FlatList
        data={fields}
        keyExtractor={(item) => item.key || item.title}
        renderItem={({ item }) => renderItem(item, data, (text, key) => {
          const keys = key.split('.');
          setProfile(prev => {
            const updatedProfile = { ...prev };
            let obj = updatedProfile;
            for (let i = 0; i < keys.length - 1; i++) {
              obj[keys[i]] = { ...obj[keys[i]] };
              obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = text;
            return updatedProfile;
          });
        })}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={() => {
          return isnew ? <></> : <Text style={styles(data).fieldLabel}>ID: {profile.id}</Text>
        }}
        ListFooterComponent={
          <TouchableOpacity onPress={onSubmit} style={profileStyles(data).submitBtn}>
            <Text style={profileStyles(data).submitBtnText}>Save Changes</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const profileStyles = (data) => StyleSheet.create({
  submitBtn: {
    backgroundColor: data.c7,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: data.c7,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  submitBtnText: {
    color: data.c1,
    fontWeight: data.fw1,
    fontSize: data.fs2,
  },
});

//-----------------//
// SETTINGS SCREEN //
//-----------------//

const SettingsScreen = () => {
  const { data, setData } = useContext(Context);

  const settings = [
    {
      type: 'slider',
      label: 'Font Scaling:',
      value: data.fss,
      step: 5,
      min: 50,
      max: 200,
      onValueChange: (value) => setData({ ...data, fss: value }),
      onSlidingComplete: (value) =>
        setData({
          ...data,
          fss: value,
          fs1: Math.round((value * DEFCONTEXT.fs1) / 100),
          fs2: Math.round((value * DEFCONTEXT.fs2) / 100),
          fs3: Math.round((value * DEFCONTEXT.fs3) / 100),
        }),
    },
  ];

  return (
    <View style={styles(data).pageContainer}>
      <FlatList
        data={settings}
        renderItem={({ item }) => renderItem(item, data)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => setData({ ...DEFCONTEXT, refresh: data.refresh })}
            style={settingsStyles(data).resetBtn}>
            <Text style={settingsStyles(data).resetText}>Reset Settings</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const settingsStyles = (data) => StyleSheet.create({
  resetBtn: {
    backgroundColor: data.c8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: data.c7,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  resetText: {
    color: data.c1,
    fontWeight: data.fw2,
    fontSize: data.fs2,
  },
});

//------------------//
// OTHER COMPONENTS //
//------------------//

const ConfirmationModal = ({ visible, onCancel, onConfirm, message, data }) => (
  <Modal visible={visible} onRequestClose={onCancel} transparent>
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles(data).modalContainer}>
      <View style={styles(data).modalContent}>
        <Text style={styles(data).modalText}>{message}</Text>
        <View style={styles(data).modalButtons}>
          <TouchableOpacity onPress={onCancel} style={styles(data).cancelBtn}>
            <Text style={styles(data).cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={styles(data).confirmBtn}>
            <Text style={styles(data).confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  </Modal>
);

const renderItem = (item, data, handleTextChange) => {
  switch (item.type) {
    case 'header':
      return <Text style={styles(data).sectionHeader}>{item.title}</Text>;
    case 'field':
      return (
        <View style={styles(data).fieldContainer}>
          <Text style={styles(data).fieldLabel}>{item.label}</Text>
          <TextInput
            style={styles(data).input}
            placeholder={`Enter ${item.label.toLowerCase().slice(0, -1)}`}
            placeholderTextColor={data.c6}
            onChangeText={(text) => handleTextChange(text, item.key)}
            value={item.value}
          />
        </View>
      );
    case 'dropdown':
      return (
        <View style={styles(data).fieldContainer}>
          <Text style={styles(data).fieldLabel}>{item.label}</Text>
          <Picker
            selectedValue={item.value}
            onValueChange={(itemValue) => handleTextChange(itemValue, item.key)}
            style={styles(data).picker}
          >
            {item.options.map((option, index) => (
              <Picker.Item
                key={index}
                label={option}
                value={item.useIndexVal ? index.toString() : option}
              />
            ))}
          </Picker>
        </View>
      );
    case 'slider':
      return (
        <View style={styles(data).fieldContainer}>
          <Text style={styles(data).fieldLabel}>{item.label}</Text>
          <Slider
            style={styles(data).slider}
            value={item.value}
            step={item.step}
            minimumValue={item.min}
            maximumValue={item.max}
            onValueChange={item.onValueChange}
            onSlidingComplete={item.onSlidingComplete}
          />
        </View>
      );
  }
};

const styles = (data) => StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: data.c2,
    padding: 16,
    justifyContent: 'flex-start',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: data.c1,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '40%',
  },
  modalText: {
    fontSize: data.fs2,
    fontWeight: data.fw2,
    marginBottom: 20,
    textAlign: 'center',
    color: data.c4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: data.c8,
  },
  cancelText: {
    fontSize: data.fs2,
    color: data.c1,
    fontWeight: data.fw2,
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: data.c9,
  },
  confirmText: {
    fontSize: data.fs2,
    color: data.c1,
    fontWeight: data.fw2,
  },
  formContainer: {
    padding: 20,
    backgroundColor: data.c2,
    borderRadius: 12,
    shadowColor: data.c3,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: data.fs1,
    fontWeight: data.fw3,
    color: data.c7,
    marginBottom: 10,
    marginTop: 20,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: data.fs2,
    fontWeight: data.fw3,
    color: data.c4,
    flex: 1,
    marginRight: 10,
  },
  input: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: data.c6,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: data.fs2,
    color: data.c4,
    backgroundColor: data.c1,
  },
  picker: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: data.c6,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: data.fs2,
    color: data.c4,
    backgroundColor: data.c1,
  },
  slider: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: data.c6,
    borderRadius: 8,
    backgroundColor: data.c1,
    paddingHorizontal: 12,
  },
});

//------------------------//
// APP/NAV-STACK/CONTEXT //
//-----------------------//

const Context = createContext();
const ContextProvider = ({ children }) => {
  const [data, setData] = useState(DEFCONTEXT);
  return (<Context.Provider value={{data, setData}}>{children}</Context.Provider>);
};

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <ContextProvider>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={({ navigation, route }) => {
            const { data, setData } = useContext(Context);
            return ({
              headerRight: route.name === 'Home' ? () => (
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Icon name="settings" size={25} color={data.c3} style={{ marginRight: 15 }} />
                </TouchableOpacity>
              ) : undefined,
              headerLeft: route.name === 'Home' ? () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={require('./assets/gelosLogo.png')}
                    style={{ width: 26, height: 30, marginHorizontal: 15 }}
                  />
                </View>
              ) : undefined,
              headerStyle: {
                backgroundColor: data.c1,
              },
              headerTitleStyle: {
                fontSize: data.fs1,
                flexDirection: 'row',
                alignItems: 'center',
              },
            })
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Home" }} />
          <Stack.Screen
            name="Update"
            component={ProfileScreen}
            options={{ title: "Update Profile" }}
          />
          <Stack.Screen
            name="Add"
            component={ProfileScreen}
            options={{ title: "Add Profile" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: "Settings Menu" }}
          />
        </Stack.Navigator>
      </ContextProvider>
    </NavigationContainer>
  );
}
