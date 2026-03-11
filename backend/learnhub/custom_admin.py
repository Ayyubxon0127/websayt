from django.contrib.admin import AdminSite


class LearnHubAdminSite(AdminSite):
    site_header = 'LearnHub Admin'
    site_title = 'LearnHub'
    index_title = 'Dashboard'


admin_site = LearnHubAdminSite(name='learnhub_admin')
