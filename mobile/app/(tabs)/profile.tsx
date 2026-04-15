import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLocationTracking } from '../../services/locationService';
import { User, LogOut, Shield, Building, Mail, Radio } from 'lucide-react-native';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { isTracking, startTracking, stopTracking } = useLocationTracking();

    const orgType = (user as any)?.organizationFeatures?.company_type || (user as any)?.companyType;
    const isTrafficPolice = orgType === 'traffic_police';

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <User size={50} color="#007AFF" />
                    </View>
                </View>
                <Text style={styles.name}>{user?.fullName}</Text>
                <Text style={styles.userId}>ID: {user?.id}</Text>
            </View>

            {isTrafficPolice && (
                <View style={styles.dutySection}>
                    <View style={styles.dutyRow}>
                        <View style={styles.dutyInfo}>
                            <Radio size={22} color={isTracking ? '#34C759' : '#8E8E93'} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.dutyTitle}>{isTracking ? 'On Duty' : 'Off Duty'}</Text>
                                <Text style={styles.dutySubtitle}>
                                    {isTracking ? 'Location tracking active' : 'Tap to go on duty'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isTracking}
                            onValueChange={(val) => val ? startTracking() : stopTracking()}
                            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Information</Text>

                <View style={styles.infoRow}>
                    <Mail size={20} color="#666" style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Shield size={20} color="#666" style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoLabel}>Role</Text>
                        <Text style={styles.infoValue}>{user?.role}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Building size={20} color="#666" style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoLabel}>Organization</Text>
                        <Text style={styles.infoValue}>{user?.organizationName || user?.organizationId || 'System'}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <LogOut size={20} color="#FF3B30" style={styles.logoutIcon} />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.version}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E7F1FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
    },
    userId: {
        fontSize: 14,
        color: '#6C757D',
        marginTop: 4,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E9ECEF',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoIcon: {
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 32,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E9ECEF',
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    version: {
        color: '#ADB5BD',
        fontSize: 12,
    },
    dutySection: {
        backgroundColor: '#fff',
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E9ECEF',
    },
    dutyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dutyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dutyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    dutySubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
});
